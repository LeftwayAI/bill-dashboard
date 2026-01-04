'use client'

import { useEffect, useState } from 'react'

interface BrainLog {
  id: number
  logType: 'tool_call' | 'tool_result' | 'thinking' | 'response' | 'session' | 'mcp' | 'error' | 'user' | 'cost'
  content: string
  metadata?: Record<string, unknown>
  timestamp: number
}

interface JobLog {
  id: number
  jobType: 'linear' | 'upgrade' | 'orchestrate' | 'wrap'
  content: string
  status: 'completed' | 'skipped' | 'error'
  timestamp: number
}

interface RecentThought {
  content: string
  timestamp: number
}

interface Milestone {
  name: string
  target: string
  deadline: string
  daysRemaining: number
  current: number
  progress: number
  status: 'not_started' | 'in_progress' | 'completed'
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
  brainLogs?: BrainLog[]
  jobLogs?: JobLog[]
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
  milestone?: Milestone
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
            <img
              src="/bill-avatar.jpg"
              alt="Bill"
              className="mb-6 w-20 h-20 rounded-full object-cover border-2 border-white/10"
            />
            <h1 className="text-3xl font-light tracking-tight mb-2" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
              Bill Makes
            </h1>
            <p className="text-white/50 text-sm tracking-wide">Autonomous Agent Dashboard</p>
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
              <StatusBadge status={stats?.status || 'unknown'} />
            </div>
            <p className="text-white/50 text-sm font-light">Autonomous Agent Dashboard</p>
          </div>
          <img
            src="/bill-avatar.jpg"
            alt="Bill"
            className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
          />
        </div>

        {stats?.birthday && (
          <p className="text-white/30 text-xs tracking-wide" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            Born {stats.birthday} · <span className="text-white/50">{stats.age}</span> old
          </p>
        )}
      </header>

      <div className="px-5 max-w-5xl mx-auto space-y-4">
        {/* Milestone Banner */}
        {stats?.milestone && (
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FCC800]/5 rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Current Milestone</p>
                  <h2 className="text-xl font-medium tracking-tight text-white">{stats.milestone.name}</h2>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light tracking-tight text-[#FCC800]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                    {stats.milestone.daysRemaining}
                  </p>
                  <p className="text-white/50 text-xs">days left</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/70" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                    ${stats.milestone.current}
                  </span>
                  <span className="text-white/50" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                    {stats.milestone.target}
                  </span>
                </div>
                <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#FCC800]/80 to-[#FCC800]/50 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(2, stats.milestone.progress)}%` }}
                  />
                </div>
              </div>
              <p className="text-white/40 text-xs">
                Target: {stats.milestone.deadline}
              </p>
            </div>
          </div>
        )}

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
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
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
                    <span className="text-white/70 text-sm">{job.name}</span>
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
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
                    <span className="text-white/60 text-sm w-24 truncate">{sender.name}</span>
                    <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/30 rounded-full transition-all duration-500"
                        style={{ width: `${(sender.count / stats.topSenders[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-white/40 text-xs w-12 text-right" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                      {sender.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Job Logs */}
        {stats?.jobLogs && stats.jobLogs.length > 0 && (
          <Card>
            <CardHeader>
              <span>Job History</span>
              <span className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                Recent runs
              </span>
            </CardHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.jobLogs.map((log) => (
                <JobLogEntry key={log.id} log={log} />
              ))}
            </div>
          </Card>
        )}

        {/* Brain Activity */}
        {stats?.brainLogs && stats.brainLogs.length > 0 && (
          <Card>
            <CardHeader>
              <span>Brain Activity</span>
              <span className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                Live feed
              </span>
            </CardHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stats.brainLogs.map((log) => (
                <BrainLogEntry key={log.id} log={log} />
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

function StatusBadge({ status }: { status: string }) {
  const isOnline = status === 'online'
  // Leftway yellow: #FCC800, grey when offline
  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
      isOnline
        ? 'bg-[#FCC800]/10 border-[#FCC800]/30'
        : 'bg-white/[0.04] border-white/10'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        isOnline ? 'bg-[#FCC800] animate-pulse' : 'bg-white/30'
      }`} />
      <span className={`text-[10px] font-medium tracking-wide ${
        isOnline ? 'text-[#FCC800]' : 'text-white/40'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 text-white/70 text-sm font-light" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-white/50 text-xs mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <p className={`text-xl sm:text-2xl font-light tracking-tight ${
          accent ? 'text-emerald-400' : 'text-white'
        }`} style={mono ? { fontFamily: 'var(--font-geist-mono), monospace' } : { fontFamily: 'Satoshi, system-ui, sans-serif' }}>
          {value}
        </p>
        {suffix && (
          <span className="text-white/40 text-xs">{suffix}</span>
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/50 text-xs">{label}</span>
        <span className={`text-sm ${
          isHigh ? 'text-red-400' : isMedium ? 'text-amber-400' : 'text-emerald-400'
        }`} style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {value}
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? 'bg-red-400/70' : isMedium ? 'bg-amber-400/70' : 'bg-emerald-400/70'
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

const JOB_TYPE_CONFIG: Record<JobLog['jobType'], { icon: string; label: string; color: string }> = {
  linear: { icon: '🔧', label: 'Linear', color: 'text-blue-400' },
  upgrade: { icon: '🧠', label: 'Upgrade', color: 'text-purple-400' },
  orchestrate: { icon: '🎯', label: 'Orchestrate', color: 'text-[#FCC800]' },
  wrap: { icon: '🌙', label: 'Wrap', color: 'text-indigo-400' },
}

const STATUS_CONFIG: Record<JobLog['status'], { badge: string; color: string }> = {
  completed: { badge: 'Done', color: 'bg-emerald-500/10 text-emerald-400' },
  skipped: { badge: 'Skip', color: 'bg-white/[0.04] text-white/40' },
  error: { badge: 'Error', color: 'bg-red-500/10 text-red-400' },
}

function JobLogEntry({ log }: { log: JobLog }) {
  const jobConfig = JOB_TYPE_CONFIG[log.jobType] || { icon: '?', label: log.jobType, color: 'text-white/50' }
  const statusConfig = STATUS_CONFIG[log.status] || { badge: log.status, color: 'bg-white/[0.04] text-white/40' }

  return (
    <div className="flex gap-3 py-3 border-b border-white/[0.03] last:border-0">
      <div className="flex-shrink-0 pt-0.5 text-lg">
        {jobConfig.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${jobConfig.color}`}>
            {jobConfig.label}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusConfig.color}`}>
            {statusConfig.badge}
          </span>
          <span className="text-white/20 text-[10px] ml-auto" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {formatTimestamp(log.timestamp)}
          </span>
        </div>
        <p className="text-white/50 text-xs leading-relaxed break-words line-clamp-3" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {log.content}
        </p>
      </div>
    </div>
  )
}

const LOG_TYPE_CONFIG: Record<BrainLog['logType'], { icon: string; label: string; color: string }> = {
  tool_call: { icon: '>', label: 'Tool', color: 'text-[#FCC800]' },
  tool_result: { icon: '<', label: 'Result', color: 'text-emerald-400' },
  thinking: { icon: '~', label: 'Thinking', color: 'text-purple-400' },
  response: { icon: '#', label: 'Response', color: 'text-blue-400' },
  session: { icon: '*', label: 'Session', color: 'text-white/50' },
  mcp: { icon: '@', label: 'MCP', color: 'text-cyan-400' },
  error: { icon: '!', label: 'Error', color: 'text-red-400' },
  user: { icon: '?', label: 'User', color: 'text-white/70' },
  cost: { icon: '$', label: 'Cost', color: 'text-amber-400' },
}

function BrainLogEntry({ log }: { log: BrainLog }) {
  const config = LOG_TYPE_CONFIG[log.logType] || { icon: '-', label: log.logType, color: 'text-white/50' }

  return (
    <div className="flex gap-3 py-2 border-b border-white/[0.03] last:border-0">
      <div className="flex-shrink-0 pt-0.5">
        <span className={`text-xs font-mono ${config.color}`}>
          {config.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          <span className="text-white/20 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {formatTimestamp(log.timestamp)}
          </span>
        </div>
        <p className="text-white/60 text-sm leading-relaxed break-words" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {log.content}
        </p>
        {log.metadata && log.logType === 'tool_call' && log.metadata.input && (
          <p className="text-white/30 text-xs mt-1 truncate" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {String(log.metadata.input).slice(0, 80)}...
          </p>
        )}
      </div>
    </div>
  )
}
