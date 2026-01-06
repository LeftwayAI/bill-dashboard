import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

interface OutboxFile {
  name: string
  url: string
  size: number
  created: string
  description?: string
}

export async function GET(request: NextRequest) {
  try {
    const outboxDir = path.join(process.cwd(), 'data', 'outbox')
    
    if (!existsSync(outboxDir)) {
      return NextResponse.json({ files: [] })
    }

    const files = await readdir(outboxDir)
    const outboxFiles: OutboxFile[] = []

    for (const file of files) {
      if (file.startsWith('.')) continue // Skip hidden files
      
      const filePath = path.join(outboxDir, file)
      const stats = await stat(filePath)
      
      // Check for accompanying .meta file for description
      const metaPath = path.join(outboxDir, `${file}.meta`)
      let description: string | undefined
      
      if (existsSync(metaPath)) {
        try {
          const metaContent = await readFile(metaPath, 'utf-8')
          const meta = JSON.parse(metaContent)
          description = meta.description
        } catch {
          // Ignore meta parsing errors
        }
      }

      outboxFiles.push({
        name: file,
        url: `/api/outbox/download/${encodeURIComponent(file)}`,
        size: stats.size,
        created: stats.birthtime.toISOString(),
        description
      })
    }

    // Sort by creation time, newest first
    outboxFiles.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

    return NextResponse.json({ files: outboxFiles })
  } catch (error) {
    console.error('[MAILBOX] Outbox listing error:', error)
    return NextResponse.json({ error: 'Failed to list outbox files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // This endpoint allows Bill to add files to the outbox
    const { fileName, content, description } = await request.json()

    if (!fileName || !content) {
      return NextResponse.json({ error: 'fileName and content required' }, { status: 400 })
    }

    const outboxDir = path.join(process.cwd(), 'data', 'outbox')
    if (!existsSync(outboxDir)) {
      await require('fs/promises').mkdir(outboxDir, { recursive: true })
    }

    // Write the file
    const filePath = path.join(outboxDir, fileName)
    
    // Handle both text and binary content
    let fileContent: Buffer
    if (typeof content === 'string') {
      // Assume base64 for binary files or plain text
      try {
        fileContent = Buffer.from(content, 'base64')
      } catch {
        fileContent = Buffer.from(content, 'utf-8')
      }
    } else {
      fileContent = Buffer.from(content)
    }
    
    await require('fs/promises').writeFile(filePath, fileContent)

    // Write metadata if description provided
    if (description) {
      const metaPath = path.join(outboxDir, `${fileName}.meta`)
      await require('fs/promises').writeFile(metaPath, JSON.stringify({ description }))
    }

    console.log(`[MAILBOX] Bill added file to outbox: ${fileName}`)

    return NextResponse.json({
      message: 'File added to outbox successfully',
      fileName,
      size: fileContent.length
    })
  } catch (error) {
    console.error('[MAILBOX] Outbox add error:', error)
    return NextResponse.json({ error: 'Failed to add file to outbox' }, { status: 500 })
  }
}