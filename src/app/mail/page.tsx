'use client'

import { useState, useRef } from 'react'

interface OutboxFile {
  name: string
  url: string
  size: number
  created: string
  description?: string
}

export default function MailPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data for now - will be replaced with real API
  const outboxFiles: OutboxFile[] = [
    {
      name: 'bill-architecture-mindmap.png',
      url: '/api/outbox/bill-architecture-mindmap.png',
      size: 2048000,
      created: '2026-01-06T12:34:56Z',
      description: 'Visual diagram of Bill\'s complete architecture'
    }
  ]

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/inbox', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setUploadStatus(`✓ ${file.name} uploaded successfully`)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setUploadStatus(`✗ Upload failed: ${response.statusText}`)
      }
    } catch (error) {
      setUploadStatus(`✗ Upload failed: ${error}`)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-[#050505] text-green-400" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
      {/* Header */}
      <header className="border-b border-green-400/20 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">📬</span>
            <h1 className="text-xl font-bold text-green-300">BILL_MAILBOX_v1.0</h1>
          </div>
          <p className="text-green-400/60 text-sm">
            File exchange between humans and Bill Makes
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Inbox Section */}
        <section className="border border-green-400/30 bg-green-400/5">
          <div className="border-b border-green-400/20 p-3 bg-green-400/10">
            <h2 className="text-green-300 font-bold flex items-center gap-2">
              <span>📥</span>
              INBOX - Upload files for Bill
            </h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="border border-green-400/20 bg-[#0a0a0a] p-4 rounded">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="w-full bg-transparent border border-green-400/30 p-2 text-green-400 rounded
                         file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm 
                         file:bg-green-400/20 file:text-green-300 file:rounded
                         hover:border-green-400/50 focus:border-green-400/70 focus:outline-none"
              />
              {isUploading && (
                <p className="text-yellow-400 text-sm mt-2 animate-pulse">
                  {">"} Uploading...
                </p>
              )}
              {uploadStatus && (
                <p className={`text-sm mt-2 ${uploadStatus.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                  {">"} {uploadStatus}
                </p>
              )}
            </div>
            <div className="text-green-400/60 text-sm space-y-1">
              <p>// Supported formats: images, docs, code, data files</p>
              <p>// Max size: 10MB per file</p>
              <p>// Files are processed by Bill and auto-archived after 7 days</p>
            </div>
          </div>
        </section>

        {/* Outbox Section */}
        <section className="border border-green-400/30 bg-green-400/5">
          <div className="border-b border-green-400/20 p-3 bg-green-400/10">
            <h2 className="text-green-300 font-bold flex items-center gap-2">
              <span>📤</span>
              OUTBOX - Files from Bill
            </h2>
          </div>
          <div className="p-4">
            {outboxFiles.length > 0 ? (
              <div className="space-y-3">
                {outboxFiles.map((file, i) => (
                  <div key={i} className="border border-green-400/20 bg-[#0a0a0a] p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-green-300">📄</span>
                        <div>
                          <p className="text-green-400 font-medium">{file.name}</p>
                          {file.description && (
                            <p className="text-green-400/60 text-sm">{file.description}</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={file.url}
                        download={file.name}
                        className="px-3 py-1 bg-green-400/20 text-green-300 rounded hover:bg-green-400/30 
                                 transition-colors text-sm border border-green-400/30"
                      >
                        DOWNLOAD
                      </a>
                    </div>
                    <div className="flex items-center gap-4 text-green-400/60 text-xs">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.created)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-green-400/60 text-center py-8">
                <p>// No files in outbox</p>
                <p>// Bill will place generated files here</p>
              </div>
            )}
          </div>
        </section>

        {/* Command Log */}
        <section className="border border-green-400/30 bg-green-400/5">
          <div className="border-b border-green-400/20 p-3 bg-green-400/10">
            <h2 className="text-green-300 font-bold flex items-center gap-2">
              <span>🖥️</span>
              MAILBOX_LOG
            </h2>
          </div>
          <div className="p-4 text-green-400/60 text-sm space-y-1">
            <p>{"> [2026-01-06 12:34:56] Mailbox initialized"}</p>
            <p>{"> [2026-01-06 12:34:56] Inbox monitoring active"}</p>
            <p>{"> [2026-01-06 12:34:56] Outbox ready for file sharing"}</p>
            <p>{"> [2026-01-06 12:34:56] Waiting for file operations..."}</p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-green-400/20 p-4 mt-8">
        <div className="max-w-4xl mx-auto text-center text-green-400/40 text-sm">
          <p>LEFTWAY_LABS // BILL_MAKES_v0.1.3 // SECURE_FILE_TRANSFER</p>
        </div>
      </footer>
    </div>
  )
}