import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename)
    const outboxDir = path.join(process.cwd(), 'data', 'outbox')
    const filePath = path.join(outboxDir, filename)

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.png': contentType = 'image/png'; break
      case '.jpg': case '.jpeg': contentType = 'image/jpeg'; break
      case '.gif': contentType = 'image/gif'; break
      case '.svg': contentType = 'image/svg+xml'; break
      case '.pdf': contentType = 'application/pdf'; break
      case '.txt': contentType = 'text/plain'; break
      case '.json': contentType = 'application/json'; break
      case '.md': contentType = 'text/markdown'; break
      case '.csv': contentType = 'text/csv'; break
      default: contentType = 'application/octet-stream'
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[MAILBOX] Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}