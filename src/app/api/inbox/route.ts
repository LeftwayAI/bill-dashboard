import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Create inbox directory if it doesn't exist
    const inboxDir = path.join(process.cwd(), 'data', 'inbox')
    if (!existsSync(inboxDir)) {
      await mkdir(inboxDir, { recursive: true })
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const fileExtension = path.extname(file.name)
    const baseName = path.basename(file.name, fileExtension)
    const fileName = `${timestamp}_${baseName}${fileExtension}`
    
    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(inboxDir, fileName)
    await writeFile(filePath, buffer)

    // Log the upload (could send to Bill's notification system)
    console.log(`[MAILBOX] File uploaded: ${fileName} (${file.size} bytes)`)

    // TODO: Notify Bill about new file via webhook/signal
    // Could POST to http://localhost:3001/api/inbox-notification

    return NextResponse.json({
      message: 'File uploaded successfully',
      fileName,
      size: file.size,
      originalName: file.name
    })
  } catch (error) {
    console.error('[MAILBOX] Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}