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
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data)
      setLastFetch(new Date())
      setError(null)
    } catch (e) {
      setError('Could not connect to Bill')
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold">Bill Makes</h1>
          {stats?.status === 'online' && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
              Online
            </span>
          )}
        </div>
        <p className="text-gray-400">Autonomous Agent Dashboard</p>
        {stats?.birthday && (
          <p className="text-gray-500 text-sm mt-1">
            Born {stats.birthday} • {stats.age} old
          </p>
        )}
      </header>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatusCard
          title="Status"
          value={stats?.status || 'unknown'}
          indicator={stats?.status === 'online' ? 'green' : 'red'}
        />
        <StatusCard
          title="Uptime"
          value={stats?.uptime || '-'}
        />
        <StatusCard
          title="Last Activity"
          value={stats?.lastActivity || '-'}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <MetricCard
          title="Total Messages"
          value={stats?.totalMessages?.toLocaleString() || '-'}
        />
        <MetricCard
          title="Sessions"
          value={stats?.totalSessions?.toLocaleString() || '-'}
        />
        <MetricCard
          title="Facts Learned"
          value={stats?.totalFacts?.toLocaleString() || '-'}
        />
      </div>

      {/* Top Senders */}
      {stats?.topSenders && stats.topSenders.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Senders</h2>
          <div className="space-y-3">
            {stats.topSenders.map((sender, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-gray-300">{sender.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(sender.count / stats.topSenders[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-500 font-mono text-sm w-16 text-right">
                    {sender.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mt-8">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-600 text-sm">
        {lastFetch && (
          <p>Last updated: {lastFetch.toLocaleTimeString()}</p>
        )}
        <p className="mt-2">
          <a href="https://leftway.ai" className="hover:text-gray-400">leftway.ai</a>
          {' • '}
          <a href="https://x.com/bill__makes" className="hover:text-gray-400">@bill__makes</a>
        </p>
      </footer>
    </main>
  )
}

function StatusCard({ title, value, indicator }: { title: string; value: string; indicator?: 'green' | 'red' }) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <div className="flex items-center gap-2">
        {indicator && (
          <span className={`w-2 h-2 rounded-full ${indicator === 'green' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
        )}
        <span className="text-2xl font-semibold capitalize">{value}</span>
      </div>
    </div>
  )
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold font-mono">{value}</p>
    </div>
  )
}
