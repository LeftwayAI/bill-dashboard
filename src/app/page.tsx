'use client'

import { useEffect, useState } from 'react'

interface Stats {
  status: 'online' | 'offline' | 'unknown'
  uptime: string
  birthday: string
  age: string
  totalMessages: number
  totalSessions: number
  totalFacts: number
  lastActivity: string
  topSenders: { name: string; count: number }[]
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
            <h1 className="text-3xl font-light tracking-tighter mb-2">Bill Makes</h1>
            <p className="text-neutral-500 text-sm tracking-wide">Autonomous Agent Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-base outline-none transition-all placeholder:text-neutral-600 focus:border-white/20 focus:bg-white/[0.04]"
                placeholder="Enter password"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-center text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-white py-3.5 text-base font-medium text-black transition-all hover:bg-neutral-200 active:scale-[0.98]"
            >
              Enter
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-neutral-600 tracking-wide">
            Leftway Labs
          </p>
        </div>
      </main>
    )
  }

  // Dashboard
  const isOnline = stats?.status === 'online'

  return (
    <main className="min-h-dvh bg-[#050505] pb-12">
      {/* Header */}
      <header className="pt-12 pb-8 px-6 max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-4xl sm:text-5xl font-light tracking-tighter">Bill Makes</h1>
              <StatusPill status={stats?.status || 'unknown'} />
            </div>
            <p className="text-neutral-500 text-lg font-light">Autonomous Agent Dashboard</p>
          </div>
          <div className="text-6xl">🤖</div>
        </div>

        {stats?.birthday && (
          <p className="text-neutral-600 text-sm font-mono tracking-wide">
            Born {stats.birthday} • <span className="text-emerald-500">{stats.age}</span> old
          </p>
        )}
      </header>

      <div className="px-6 max-w-5xl mx-auto space-y-6">
        {/* Primary Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Uptime"
            value={stats?.uptime || '-'}
            accent={isOnline}
          />
          <StatCard
            label="Messages"
            value={stats?.totalMessages?.toLocaleString() || '0'}
            mono
          />
          <StatCard
            label="Sessions"
            value={stats?.totalSessions?.toLocaleString() || '0'}
            mono
          />
          <StatCard
            label="Last Active"
            value={stats?.lastActivity ? formatTime(stats.lastActivity) : '-'}
          />
        </div>

        {/* System Metrics */}
        {stats?.system && (
          <div className="grid gap-4 grid-cols-3">
            <SystemMetric label="CPU" value={stats.system.cpu} />
            <SystemMetric label="Memory" value={stats.system.memory} />
            <SystemMetric label="Disk" value={stats.system.disk} />
          </div>
        )}

        {/* Jobs Section */}
        {stats?.jobs && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-light tracking-tight">Scheduled Jobs</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${
                stats.jobs.enabled
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-neutral-800 text-neutral-500'
              }`}>
                {stats.jobs.enabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
            <div className="space-y-3">
              {stats.jobs.list.map((job, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-neutral-300">{job.name}</span>
                  <span className="text-neutral-600 font-mono text-sm">{job.interval}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Senders */}
        {stats?.topSenders && stats.topSenders.length > 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="text-lg font-light tracking-tight mb-5">Top Senders</h2>
            <div className="space-y-4">
              {stats.topSenders.map((sender, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-neutral-400 w-28 truncate">{sender.name}</span>
                  <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${(sender.count / stats.topSenders[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-neutral-600 font-mono text-sm w-16 text-right">
                    {sender.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-red-400 text-sm">{fetchError}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="pt-8 text-center">
          {lastFetch && (
            <p className="text-neutral-700 text-xs font-mono mb-3">
              Updated {lastFetch.toLocaleTimeString()}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 text-neutral-600 text-sm">
            <a href="https://leftway.ai" className="hover:text-neutral-400 transition-colors">
              leftway.ai
            </a>
            <span className="text-neutral-800">•</span>
            <a href="https://x.com/bill__makes" className="hover:text-neutral-400 transition-colors">
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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
      isOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'
    }`}>
      <span className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-emerald-500 animate-pulse-subtle' : 'bg-red-500'
      }`} />
      <span className={`text-xs font-medium tracking-wide ${
        isOnline ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  )
}

function StatCard({ label, value, mono, accent }: {
  label: string
  value: string
  mono?: boolean
  accent?: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 card-hover">
      <p className="text-neutral-500 text-sm mb-2">{label}</p>
      <p className={`text-2xl sm:text-3xl font-light tracking-tight ${
        mono ? 'font-mono' : ''
      } ${accent ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </p>
    </div>
  )
}

function SystemMetric({ label, value }: { label: string; value: string }) {
  const numValue = parseFloat(value) || 0
  const isHigh = numValue > 80
  const isMedium = numValue > 50

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-neutral-500 text-sm">{label}</span>
        <span className={`font-mono text-lg ${
          isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
        }`}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
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
