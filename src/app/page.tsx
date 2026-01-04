'use client'

import { useEffect, useState } from 'react'

interface RecentThought {
  content: string
  timestamp: number
}

interface Stats {
  status: 'online' | 'offline' | 'unknown'
  uptime: string
  birthday: string
  age: string
  totalMessages: number
  totalSessions: number
  totalFacts: number
  todayMessages: number
  lastActivity: string
  topSenders: { name: string; count: number }[]
  recentThinking?: RecentThought[]
  system?: {
    cpu: string
    memory: string
    disk: string
  }
  jobs?: {
    enabled: boolean
    running: boolean
    lastUpgrade: string | null
    lastOrchestrate: string | null
    list: { name: string; interval: string }[]
  }
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('bm-auth')
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('bm-auth', 'true')
        setIsAuthenticated(true)
        setError('')
      } else {
        setError('Invalid password')
      }
    } catch {
      setError('Something went wrong')
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data)
      setLastFetch(new Date())
      setFetchError(null)
    } catch {
      setFetchError('Could not connect to Bill')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats()
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  // Login screen
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4 bg-[#050505]">
        <div className="w-full max-w-sm">
          <div className="mb-12 flex flex-col items-center">
            <div className="mb-6 text-6xl">🤖</div>
            <h1 className="text-3xl font-light tracking-tight mb-2" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
              Bill Makes
            </h1>
            <p className="text-white/40 text-sm tracking-wide">Autonomous Agent Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-base outline-none transition-all placeholder:text-white/30 focus:border-white/10 focus:bg-white/[0.03]"
                placeholder="Enter password"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-400/80">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-2xl bg-white py-3.5 text-base font-medium text-[#050505] transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              Enter
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-white/20 tracking-wide">
            Leftway Labs
          </p>
        </div>
      </main>
    )
  }

  // Dashboard
  const isOnline = stats?.status === 'online'

  return (
    <main className="min-h-dvh bg-[#050505] pb-16">
      {/* Header */}
      <header className="pt-10 pb-6 px-5 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                Bill Makes
              </h1>
              <StatusPill status={stats?.status || 'unknown'} />
            </div>
            <p className="text-white/30 text-sm font-light">Autonomous Agent Dashboard</p>
          </div>
          <div className="text-5xl opacity-80">🤖</div>
        </div>

        {stats?.birthday && (
          <p className="text-white/20 text-xs tracking-wide" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            Born {stats.birthday} · <span className="text-white/40">{stats.age}</span> old
          </p>
        )}
      </header>

      <div className="px-5 max-w-5xl mx-auto space-y-4">
        {/* Hero Stats Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Uptime"
            value={stats?.uptime || '-'}
            accent={isOnline}
          />
          <StatCard
            label="Today"
            value={stats?.todayMessages?.toString() || '0'}
            suffix="msgs"
            mono
          />
          <StatCard
            label="Total"
            value={stats?.totalMessages?.toLocaleString() || '0'}
            suffix="msgs"
            mono
          />
          <StatCard
            label="Active"
            value={stats?.lastActivity ? formatTime(stats.lastActivity) : '-'}
          />
        </div>

        {/* System Health */}
        {stats?.system && (
          <div className="grid gap-3 grid-cols-3">
            <SystemMetric label="CPU" value={stats.system.cpu} />
            <SystemMetric label="Memory" value={stats.system.memory} />
            <SystemMetric label="Disk" value={stats.system.disk} />
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Jobs */}
          {stats?.jobs && (
            <Card>
              <CardHeader>
                <span>Scheduled Jobs</span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium tracking-wider uppercase ${
                  stats.jobs.enabled
                    ? 'bg-emerald-500/10 text-emerald-400/80'
                    : 'bg-white/[0.04] text-white/30'
                }`}>
                  {stats.jobs.enabled ? 'Active' : 'Paused'}
                </span>
              </CardHeader>
              <div className="space-y-2">
                {stats.jobs.list.map((job, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] last:border-0">
                    <span className="text-white/50 text-sm">{job.name}</span>
                    <span className="text-white/25 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                      {job.interval}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Top Senders */}
          {stats?.topSenders && stats.topSenders.length > 0 && (
            <Card>
              <CardHeader>
                <span>Top Senders</span>
              </CardHeader>
              <div className="space-y-3">
                {stats.topSenders.map((sender, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-white/40 text-sm w-24 truncate">{sender.name}</span>
                    <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/20 rounded-full transition-all duration-500"
                        style={{ width: `${(sender.count / stats.topSenders[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-white/25 text-xs w-12 text-right" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                      {sender.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Recent Thinking */}
        {stats?.recentThinking && stats.recentThinking.length > 0 && (
          <Card>
            <CardHeader>
              <span>Recent Thoughts</span>
              <span className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                Live feed
              </span>
            </CardHeader>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {stats.recentThinking.map((thought, i) => (
                <div key={i} className="pb-3 border-b border-white/[0.03] last:border-0">
                  <p className="text-white/40 text-sm leading-relaxed mb-1.5">
                    {thought.content}
                  </p>
                  <span className="text-white/15 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                    {formatTimestamp(thought.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-red-400/70 text-sm">{fetchError}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-6 text-center">
          {lastFetch && (
            <p className="text-white/15 text-xs mb-3" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              Updated {lastFetch.toLocaleTimeString()}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 text-white/25 text-xs">
            <a href="https://leftway.ai" className="hover:text-white/40 transition-colors">
              leftway.ai
            </a>
            <span className="text-white/10">·</span>
            <a href="https://x.com/bill__makes" className="hover:text-white/40 transition-colors">
              @bill__makes
            </a>
          </div>
        </footer>
      </div>
    </main>
  )
}

function StatusPill({ status }: { status: string }) {
  const isOnline = status === 'online'
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
      isOnline ? 'bg-emerald-500/10' : 'bg-red-500/10'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isOnline ? 'bg-emerald-400/80 animate-pulse' : 'bg-red-400/80'
      }`} />
      <span className={`text-[10px] font-medium tracking-wider uppercase ${
        isOnline ? 'text-emerald-400/70' : 'text-red-400/70'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-5">
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 text-white/50 text-sm font-light" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, mono, accent, suffix }: {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
  suffix?: string
}) {
  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-4">
      <p className="text-white/30 text-xs mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className={`text-xl sm:text-2xl font-light tracking-tight ${
          accent ? 'text-emerald-400/70' : 'text-white/80'
        }`} style={mono ? { fontFamily: 'var(--font-geist-mono), monospace' } : { fontFamily: 'Satoshi, system-ui, sans-serif' }}>
          {value}
        </p>
        {suffix && (
          <span className="text-white/20 text-xs">{suffix}</span>
        )}
      </div>
    </div>
  )
}

function SystemMetric({ label, value }: { label: string; value: string }) {
  const numValue = parseFloat(value) || 0
  const isHigh = numValue > 80
  const isMedium = numValue > 50

  return (
    <div className="rounded-2xl border border-white/[0.04] bg-white/[0.015] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/30 text-xs">{label}</span>
        <span className={`text-sm ${
          isHigh ? 'text-red-400/70' : isMedium ? 'text-amber-400/70' : 'text-emerald-400/70'
        }`} style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {value}
        </span>
      </div>
      <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? 'bg-red-400/50' : isMedium ? 'bg-amber-400/50' : 'bg-emerald-400/50'
          }`}
          style={{ width: `${Math.min(numValue, 100)}%` }}
        />
      </div>
    </div>
  )
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return dateStr
  }
}

function formatTimestamp(ts: number): string {
  try {
    const date = new Date(ts)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '-'
  }
}
