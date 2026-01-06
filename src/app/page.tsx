'use client'

import { useEffect, useState, useCallback } from 'react'

interface BrainLog {
  id: number
  logType: 'tool_call' | 'tool_result' | 'thinking' | 'response' | 'session' | 'mcp' | 'error' | 'user' | 'cost' | 'status'
  content: string
  metadata?: Record<string, unknown> & { turns?: number; costUsd?: number }
  timestamp: number
  sessionId?: string
}

interface LiveSession {
  sessionId: string
  topicName?: string
  status: 'idle' | 'thinking' | 'responding' | 'error'
  currentRequest?: string
  startedAt?: number
  lastHeartbeat: number
  metadata?: Record<string, unknown>
  currentStatus?: string // The emoji status message like "🐙 GitHub things..."
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
  liveSessions?: LiveSession[]
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
      // Poll every 5 seconds for more live feel
      const interval = setInterval(fetchStats, 5000)
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
  const activeSessions = stats?.liveSessions?.filter(s => s.status === 'thinking' || s.status === 'responding') || []

  // Get all sessions for the windows view
  const allSessions = stats?.liveSessions || []

  return (
    <main className="min-h-dvh bg-[#050505] pb-16">
      {/* Profile Header - New Layout: Online under name, cycling text to right */}
      <header className="pt-6 pb-4 px-4 sm:px-5 max-w-5xl mx-auto">
        <div className="flex items-start gap-3 sm:gap-4">
          <img
            src="/bill-avatar.jpg"
            alt="Bill"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            {/* Row 1: Bill Makes + Cycling Text */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-medium tracking-tight whitespace-nowrap" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
                Bill Makes
              </h1>
              <CyclingText />
            </div>
            {/* Row 2: Online badge */}
            <div className="mb-1.5">
              <StatusBadge status={stats?.status || 'unknown'} />
            </div>
            {/* Row 3: Stats */}
            <p className="text-white/40 text-xs sm:text-sm truncate" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {stats?.age || '-'} · {stats?.uptime || '-'} uptime · {stats?.totalMessages?.toLocaleString() || '0'} msgs
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-5 max-w-5xl mx-auto space-y-4">
        {/* Brain Command Deck - The carnival-style activity monitor */}
        {stats?.brainLogs && (
          <BrainCommandDeck
            logs={stats.brainLogs}
            sessions={allSessions}
          />
        )}

        {/* Live Thinking Windows - Show ALL sessions as windows */}
        {allSessions.length > 0 && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
            {allSessions.map((session) => (
              <ThinkingWindow
                key={session.sessionId}
                session={session}
                logs={stats?.brainLogs?.filter(l => l.sessionId === session.sessionId) || []}
              />
            ))}
          </div>
        )}

        {/* Show placeholder when no sessions */}
        {allSessions.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
            <p className="text-white/30 text-sm" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              No active sessions yet. Message Bill to start one.
            </p>
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

        {/* Job History - No truncation, expandable */}
        {stats?.jobLogs && stats.jobLogs.length > 0 && (
          <Card>
            <CardHeader>
              <span>Jobs</span>
              <span className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                {stats.jobLogs.length} runs
              </span>
            </CardHeader>
            <div className="space-y-2">
              {stats.jobLogs.map((log) => (
                <ExpandableJobLog key={log.id} log={log} />
              ))}
            </div>
          </Card>
        )}

        {/* Brain Activity - Full logs, expandable */}
        {stats?.brainLogs && stats.brainLogs.length > 0 && (
          <Card>
            <CardHeader>
              <span>Recent Activity</span>
              <span className="text-white/20 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                {stats.brainLogs.length} events
              </span>
            </CardHeader>
            <div className="space-y-2">
              {stats.brainLogs.slice(0, 20).map((log) => (
                <ExpandableBrainLog key={log.id} log={log} />
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
          <div className="flex items-center justify-center gap-4 text-white/25 text-xs flex-wrap">
            <a href="/changelog" className="hover:text-white/40 transition-colors">
              Changelog
            </a>
            <span className="text-white/10">·</span>
            <a href="/contributions" className="hover:text-white/40 transition-colors">
              Contributions
            </a>
            <span className="text-white/10">·</span>
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
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
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
  status: { icon: '⚡', label: 'Status', color: 'text-[#FCC800]' },
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
        {log.metadata && log.logType === 'tool_call' && 'input' in log.metadata && log.metadata.input ? (
          <p className="text-white/30 text-xs mt-1 truncate" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {String(log.metadata.input).slice(0, 80)}...
          </p>
        ) : null}
      </div>
    </div>
  )
}

const SESSION_STATUS_CONFIG: Record<LiveSession['status'], { icon: string; label: string; color: string; bgColor: string }> = {
  thinking: { icon: '🧠', label: 'Thinking', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  responding: { icon: '💬', label: 'Responding', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  idle: { icon: '💤', label: 'Idle', color: 'text-white/40', bgColor: 'bg-white/[0.02] border-white/[0.06]' },
  error: { icon: '⚠️', label: 'Error', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/20' },
}

function LiveSessionCard({ session, logs }: { session: LiveSession; logs: BrainLog[] }) {
  const [isExpanded, setIsExpanded] = useState(session.status === 'thinking' || session.status === 'responding')
  const config = SESSION_STATUS_CONFIG[session.status]

  const timeSinceHeartbeat = Date.now() - session.lastHeartbeat
  const isStale = timeSinceHeartbeat > 60000 // 1 minute

  // Parse topic name from sessionId if not provided
  const displayName = session.topicName || session.sessionId.split(':').pop()?.replace('topic_', '#') || session.sessionId

  return (
    <div className={`rounded-xl border ${config.bgColor} overflow-hidden transition-all duration-200`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{config.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-sm font-medium">{displayName}</span>
              <span className={`text-[10px] uppercase tracking-wider ${config.color}`}>
                {config.label}
              </span>
            </div>
            {session.currentRequest && (
              <p className="text-white/40 text-xs mt-0.5 truncate max-w-[300px]">
                {session.currentRequest}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session.startedAt && session.status === 'thinking' && (
            <span className="text-white/30 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {formatDuration(Date.now() - session.startedAt)}
            </span>
          )}
          <span className={`text-white/30 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-white/[0.06] p-4 pt-3">
          {logs.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {logs.slice(0, 10).map((log) => (
                <BrainLogEntry key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <p className="text-white/30 text-xs text-center py-2">
              No activity logs for this session yet
            </p>
          )}
          <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
            <span className="text-white/20 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {session.sessionId}
            </span>
            {isStale && (
              <span className="text-amber-400/60 text-[10px]">
                Last heartbeat: {formatDuration(timeSinceHeartbeat)} ago
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

// "Bill Makes..." cycling text component
// TODO(bill): Make this dynamic - fetch project list from Notion or a config file
const BILL_MAKES_PHRASES = [
  // Our projects (hardcoded for now)
  'emoji.today',
  'name.bot',
  'ath.oo',
  'hyperlinkgrid.xyz',
  'usalllookbad',
  'skills.forex',
  'leftway.ai',
  'fly.town',
  'unsaid.to',
  // Fun verb phrases
  'time for people',
  'things happen',
  'the impossible possible',
  'people laugh',
  'people happy',
  'money moves',
  'connections',
  'magic',
  'sense of chaos',
  'mistakes (and fixes them)',
  'progress',
  'decisions',
  'it look easy',
  'himself useful',
  'the humans proud',
  'ideas real',
  'tomorrow better',
  'every day count',
  'complexity simple',
  'bugs disappear',
  'features appear',
  'coffee nervous',
  'AI look good',
  'things ship',
  'deadlines',
  'exceptions (and catches them)',
  'the call',
  'it rain commits',
  'docs actually helpful',
  'tests pass',
  'users smile',
]

function CyclingText() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Shuffle phrases on mount for variety
  const [phrases] = useState(() => {
    const shuffled = [...BILL_MAKES_PHRASES]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  })

  const cycle = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length)
      setIsVisible(true)
    }, 300) // Match fade-out duration
  }, [phrases.length])

  useEffect(() => {
    const interval = setInterval(cycle, 3000)
    return () => clearInterval(interval)
  }, [cycle])

  return (
    <span
      className={`text-white/40 text-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
    >
      {phrases[currentIndex]}
    </span>
  )
}

// Brain Command Deck - Carnival-style meters showing brain activity
// The arcade game meter that shows how hard Bill is thinking
function BrainCommandDeck({ logs, sessions }: { logs: BrainLog[]; sessions: LiveSession[] }) {
  // Calculate activity metrics from logs
  const now = Date.now()
  const recentLogs = logs.filter(l => now - l.timestamp < 60000) // Last minute
  const veryRecentLogs = logs.filter(l => now - l.timestamp < 5000) // Last 5 seconds

  // Count by type
  const typeCounts = recentLogs.reduce((acc, log) => {
    acc[log.logType] = (acc[log.logType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Get cost data from recent cost logs
  const costLogs = logs.filter(l => l.logType === 'cost' && l.metadata?.costUsd)
  const recentCost = costLogs.slice(-5).reduce((sum, l) => sum + (l.metadata?.costUsd || 0), 0)
  const totalTurns = costLogs.slice(-5).reduce((sum, l) => sum + (l.metadata?.turns || 0), 0)

  // Is actively thinking right now?
  const isActivelyThinking = sessions.some(s => s.status === 'thinking' || s.status === 'responding')
  const activeSessionCount = sessions.filter(s => s.status === 'thinking' || s.status === 'responding').length

  // Calculate "brain power" - a composite score
  const brainPower = Math.min(100,
    (typeCounts.tool_call || 0) * 8 +
    (typeCounts.thinking || 0) * 10 +
    (typeCounts.response || 0) * 5 +
    (veryRecentLogs.length * 15) +
    (isActivelyThinking ? 30 : 0)
  )

  // Activity bars configuration
  const activityBars = [
    { label: 'TOOL', value: Math.min(100, (typeCounts.tool_call || 0) * 15), color: '#FCC800' },
    { label: 'THINK', value: Math.min(100, (typeCounts.thinking || 0) * 20), color: '#a855f7' },
    { label: 'RESP', value: Math.min(100, (typeCounts.response || 0) * 15), color: '#3b82f6' },
    { label: 'MCP', value: Math.min(100, (typeCounts.mcp || 0) * 20), color: '#06b6d4' },
    { label: 'ERR', value: Math.min(100, (typeCounts.error || 0) * 50), color: '#ef4444' },
    { label: 'COST', value: Math.min(100, recentCost * 5000), color: '#f59e0b' },
    { label: 'SESS', value: Math.min(100, activeSessionCount * 33), color: '#10b981' },
    { label: 'PWR', value: brainPower, color: '#FCC800' },
  ]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0a0a0a] to-[#050505] p-5 relative overflow-hidden scanlines">
      {/* Header with arcade feel */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎰</span>
          <div>
            <h3 className="text-white/80 text-sm font-medium" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
              Brain Command Deck
            </h3>
            <p className="text-white/30 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              NEURAL ACTIVITY MONITOR
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isActivelyThinking ? 'bg-[#FCC800]/10 border border-[#FCC800]/30' : 'bg-white/[0.02] border border-white/[0.06]'}`}>
          <span className={`w-2 h-2 rounded-full ${isActivelyThinking ? 'bg-[#FCC800] animate-pulse' : 'bg-white/30'}`} />
          <span className={`text-xs font-medium ${isActivelyThinking ? 'text-[#FCC800]' : 'text-white/40'}`} style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {isActivelyThinking ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
      </div>

      {/* Main power meter - the carnival game */}
      <div className="flex gap-6 mb-6">
        {/* Big vertical meter */}
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-48 bg-[#0a0a0a] border-2 border-white/10 rounded-lg overflow-hidden">
            {/* Segment markers */}
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-white/10"
                style={{ bottom: `${(i + 1) * 10}%` }}
              />
            ))}
            {/* The meter fill */}
            <div
              className={`absolute bottom-0 left-1 right-1 rounded transition-all duration-500 ${isActivelyThinking ? 'animate-meter-pulse' : ''}`}
              style={{
                height: `${brainPower}%`,
                background: brainPower > 80
                  ? 'linear-gradient(to top, #FCC800, #ff6b35)'
                  : brainPower > 50
                    ? 'linear-gradient(to top, #FCC800, #a855f7)'
                    : 'linear-gradient(to top, #10b981, #FCC800)',
                boxShadow: isActivelyThinking ? '0 0 20px rgba(252, 200, 0, 0.5)' : 'none',
              }}
            />
            {/* Peak marker */}
            {brainPower > 80 && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                🔥
              </div>
            )}
          </div>
          <span className="mt-2 text-2xl font-bold text-[#FCC800]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {brainPower}
          </span>
          <span className="text-white/30 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            BRAIN PWR
          </span>
        </div>

        {/* 8 activity bars - arcade style */}
        <div className="flex-1 grid grid-cols-4 gap-3">
          {activityBars.map((bar, i) => (
            <div key={bar.label} className="flex flex-col items-center">
              <div className="relative w-full h-20 bg-[#0a0a0a] border border-white/10 rounded overflow-hidden">
                {/* Segment lines */}
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="absolute left-0 right-0 h-px bg-white/5"
                    style={{ bottom: `${(j + 1) * 20}%` }}
                  />
                ))}
                {/* Bar fill */}
                <div
                  className={`absolute bottom-0 left-0.5 right-0.5 rounded-sm transition-all duration-300 ${bar.value > 70 && isActivelyThinking ? 'animate-meter-pulse' : ''}`}
                  style={{
                    height: `${bar.value}%`,
                    backgroundColor: bar.color,
                    opacity: bar.value > 0 ? 0.8 : 0.2,
                    boxShadow: bar.value > 50 ? `0 0 10px ${bar.color}40` : 'none',
                  }}
                />
              </div>
              <span className="mt-1 text-[10px] text-white/40" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 text-center border-t border-white/[0.04] pt-4">
        <div>
          <span className="text-lg font-bold text-[#FCC800]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {recentLogs.length}
          </span>
          <p className="text-white/30 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>EVENTS/MIN</p>
        </div>
        <div>
          <span className="text-lg font-bold text-purple-400" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {totalTurns}
          </span>
          <p className="text-white/30 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>TURNS</p>
        </div>
        <div>
          <span className="text-lg font-bold text-amber-400" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            ${recentCost.toFixed(4)}
          </span>
          <p className="text-white/30 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>RECENT $</p>
        </div>
        <div>
          <span className="text-lg font-bold text-emerald-400" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {activeSessionCount}
          </span>
          <p className="text-white/30 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>SESSIONS</p>
        </div>
      </div>
    </div>
  )
}

// ThinkingWindow - Live scrolling feed with blur/fade effect and status message
function ThinkingWindow({ session, logs }: { session: LiveSession; logs: BrainLog[] }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayName = session.topicName || session.sessionId.split(':').pop()?.replace('topic_', '#') || session.sessionId
  const isThinking = session.status === 'thinking'
  const isActive = session.status === 'thinking' || session.status === 'responding'

  // Get the last 10 logs to show in the window
  const recentLogs = logs.slice(-10).reverse()

  // Get the most recent status log if any
  const statusLogs = logs.filter(l => l.logType === 'status' || l.logType === 'tool_call')
  const latestStatus = statusLogs[statusLogs.length - 1]

  // Determine display status - use currentStatus from session metadata, or latest status log, or default
  const displayStatus = session.currentStatus 
    || (latestStatus?.logType === 'status' ? latestStatus.content : null)
    || (isThinking ? 'Thinking...' : 'Waiting for activity...')

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-400 animate-pulse' : 'bg-blue-400'}`} />
          <span className="text-white/70 text-sm font-medium">{displayName}</span>
        </div>
        <span className="text-white/30 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {session.startedAt ? formatDuration(Date.now() - session.startedAt) : 'active'}
        </span>
      </div>

      {/* Status message - the emoji status from Telegram */}
      <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.01]">
        <p className={`text-sm ${isActive ? 'text-white/80' : 'text-white/40'}`} style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {displayStatus}
        </p>
      </div>

      {/* Thinking feed with blur/fade effect */}
      <div 
        className="relative overflow-hidden cursor-pointer transition-all duration-300"
        style={{ height: isExpanded ? 'auto' : '120px', minHeight: isExpanded ? '200px' : '120px' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Top fade gradient */}
        {!isExpanded && (
          <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        )}

        {/* Bottom fade gradient */}
        {!isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        )}

        {/* Logs feed */}
        <div className={`px-4 py-2 space-y-1 ${isExpanded ? 'max-h-96 overflow-y-auto' : ''}`}>
          {recentLogs.length > 0 ? (
            recentLogs.map((log, i) => {
              const config = LOG_TYPE_CONFIG[log.logType] || { icon: '-', label: log.logType, color: 'text-white/50' }
              // When collapsed, apply blur to non-middle items
              const isMiddle = !isExpanded && i === Math.floor(recentLogs.length / 2)
              const distanceFromMiddle = Math.abs(i - Math.floor(recentLogs.length / 2))
              const opacity = isExpanded ? 0.7 : (isMiddle ? 0.8 : Math.max(0.2, 0.8 - distanceFromMiddle * 0.15))
              const blur = isExpanded ? 0 : (isMiddle ? 0 : distanceFromMiddle * 0.3)

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-2 py-1 transition-all duration-200"
                  style={{
                    opacity,
                    filter: blur > 0 ? `blur(${blur}px)` : 'none',
                  }}
                >
                  <span className={`text-[10px] ${config.color}`} style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                    {config.icon}
                  </span>
                  <p
                    className={`text-xs leading-relaxed line-clamp-2 ${isMiddle && !isExpanded ? 'text-white/70' : 'text-white/50'}`}
                    style={{ fontFamily: 'var(--font-geist-mono), monospace' }}
                  >
                    {log.content}
                  </p>
                </div>
              )
            })
          ) : (
            <p className="text-white/30 text-sm text-center py-4" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {isActive ? 'Processing...' : 'No recent activity'}
            </p>
          )}
        </div>
      </div>

      {/* Expand hint */}
      <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-center">
        <span className="text-white/20 text-[10px]" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          {isExpanded ? 'Click to collapse' : 'Click to expand'}
        </span>
      </div>

      {/* Current request if any */}
      {session.currentRequest && (
        <div className="px-4 py-2 border-t border-white/[0.04] bg-white/[0.01]">
          <p className="text-white/40 text-xs" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            → {session.currentRequest}
          </p>
        </div>
      )}
    </div>
  )
}

// Expandable Job Log - click to see full content
function ExpandableJobLog({ log }: { log: JobLog }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const jobConfig = JOB_TYPE_CONFIG[log.jobType] || { icon: '?', label: log.jobType, color: 'text-white/50' }
  const statusConfig = STATUS_CONFIG[log.status] || { badge: log.status, color: 'bg-white/[0.04] text-white/40' }

  return (
    <div className="border-b border-white/[0.03] last:border-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-3 flex gap-3 text-left hover:bg-white/[0.01] transition-colors"
      >
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
            <span className={`text-white/30 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
          {!isExpanded && (
            <p className="text-white/50 text-xs leading-relaxed break-words line-clamp-2" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {log.content}
            </p>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="pb-3 pl-10 pr-3">
          <pre className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {log.content}
          </pre>
        </div>
      )}
    </div>
  )
}

// Expandable Brain Log - click to see full content and metadata
function ExpandableBrainLog({ log }: { log: BrainLog }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = LOG_TYPE_CONFIG[log.logType] || { icon: '-', label: log.logType, color: 'text-white/50' }

  return (
    <div className="border-b border-white/[0.03] last:border-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2 flex gap-3 text-left hover:bg-white/[0.01] transition-colors"
      >
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
            <span className={`text-white/30 text-xs ml-auto transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
          {!isExpanded && (
            <p className="text-white/60 text-sm leading-relaxed break-words line-clamp-2" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
              {log.content}
            </p>
          )}
        </div>
      </button>
      {isExpanded && (
        <div className="pb-3 pl-8 pr-3 space-y-2">
          <pre className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {log.content}
          </pre>
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <details className="text-white/40">
              <summary className="text-xs cursor-pointer hover:text-white/60">Metadata</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap break-words" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
