'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
  relativeDate: string
}

interface Stats {
  git?: {
    commits: GitCommit[]
  }
}

export default function ChangelogPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('bm-auth')
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/stats')
        .then(res => res.json())
        .then(data => {
          setStats(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 bg-[#050505]">
        <div className="text-center">
          <p className="text-white/50 mb-4">Please log in first</p>
          <Link href="/" className="text-[#FCC800] hover:underline">
            Go to Dashboard
          </Link>
        </div>
      </main>
    )
  }

  const commits = stats?.git?.commits || []

  return (
    <main className="min-h-dvh bg-[#050505] pb-16">
      <header className="pt-6 pb-4 px-4 sm:px-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-white/40 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-medium tracking-tight" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
            Changelog
          </h1>
        </div>
        <p className="text-white/40 text-sm" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          Recent commits to bill-makes
        </p>
      </header>

      <div className="px-4 sm:px-5 max-w-3xl mx-auto">
        {loading ? (
          <div className="text-white/30 text-center py-12">Loading...</div>
        ) : commits.length === 0 ? (
          <div className="text-white/30 text-center py-12">No commits found</div>
        ) : (
          <div className="space-y-1">
            {commits.map((commit, i) => (
              <CommitRow key={commit.hash} commit={commit} isFirst={i === 0} isLast={i === commits.length - 1} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="pt-12 text-center">
          <div className="flex items-center justify-center gap-4 text-white/25 text-xs">
            <Link href="/" className="hover:text-white/40 transition-colors">
              Dashboard
            </Link>
            <span className="text-white/10">·</span>
            <Link href="/contributions" className="hover:text-white/40 transition-colors">
              Contributions
            </Link>
            <span className="text-white/10">·</span>
            <a href="https://github.com/leftwayai/bill-makes" className="hover:text-white/40 transition-colors">
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </main>
  )
}

function CommitRow({ commit, isFirst, isLast }: { commit: GitCommit; isFirst: boolean; isLast: boolean }) {
  // Parse commit type from conventional commit format
  const typeMatch = commit.message.match(/^(\w+)(?:\([^)]+\))?:\s*(.+)/)
  const type = typeMatch?.[1] || 'commit'
  const message = typeMatch?.[2] || commit.message

  const typeConfig: Record<string, { color: string; bg: string }> = {
    feat: { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    fix: { color: 'text-red-400', bg: 'bg-red-500/10' },
    docs: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    refactor: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
    chore: { color: 'text-white/40', bg: 'bg-white/[0.04]' },
    style: { color: 'text-pink-400', bg: 'bg-pink-500/10' },
    test: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
    perf: { color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  }

  const config = typeConfig[type] || { color: 'text-white/50', bg: 'bg-white/[0.04]' }

  return (
    <div className="flex gap-4 py-3 border-b border-white/[0.04] last:border-0">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1.5">
        <div className="w-2 h-2 rounded-full bg-[#FCC800]" />
        {!isLast && <div className="w-px flex-1 bg-white/[0.06] mt-2" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${config.color} ${config.bg}`}>
            {type}
          </span>
          <span className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {commit.relativeDate}
          </span>
        </div>
        <p className="text-white/80 text-sm leading-relaxed">
          {message}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-white/30 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {commit.shortHash}
          </span>
          <span className="text-white/20 text-xs">
            by {commit.author}
          </span>
        </div>
      </div>
    </div>
  )
}
