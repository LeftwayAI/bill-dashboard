'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

interface GitContribution {
  date: string
  count: number
}

interface Stats {
  git?: {
    contributions: GitContribution[]
  }
  birthday?: string
}

export default function ContributionsPage() {
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

  const contributions = stats?.git?.contributions || []
  const totalCommits = contributions.reduce((sum, c) => sum + c.count, 0)
  const activeDays = contributions.filter(c => c.count > 0).length

  return (
    <main className="min-h-dvh bg-[#050505] pb-16">
      <header className="pt-6 pb-4 px-4 sm:px-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-white/40 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-medium tracking-tight" style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}>
            Contributions
          </h1>
        </div>
        <p className="text-white/40 text-sm mb-4" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
          Bill&apos;s commit activity over the past year
        </p>

        {/* Stats summary */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-[#FCC800] font-medium">{totalCommits}</span>
            <span className="text-white/40 ml-1.5">commits</span>
          </div>
          <div>
            <span className="text-white/70 font-medium">{activeDays}</span>
            <span className="text-white/40 ml-1.5">active days</span>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-5 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-white/30 text-center py-12">Loading...</div>
        ) : (
          <ContributionGraph contributions={contributions} />
        )}

        {/* Footer */}
        <footer className="pt-12 text-center">
          <div className="flex items-center justify-center gap-4 text-white/25 text-xs">
            <Link href="/" className="hover:text-white/40 transition-colors">
              Dashboard
            </Link>
            <span className="text-white/10">·</span>
            <Link href="/changelog" className="hover:text-white/40 transition-colors">
              Changelog
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

function ContributionGraph({ contributions }: { contributions: GitContribution[] }) {
  const [hoveredDay, setHoveredDay] = useState<GitContribution | null>(null)

  // Organize data into weeks (columns) and days (rows)
  const { weeks, months } = useMemo(() => {
    if (contributions.length === 0) return { weeks: [], months: [] }

    // Find the max count for color scaling
    const maxCount = Math.max(...contributions.map(c => c.count), 1)

    // Group by weeks (7 days each)
    const weeks: GitContribution[][] = []
    let currentWeek: GitContribution[] = []

    // Start from the first Sunday
    const firstDate = new Date(contributions[0].date)
    const dayOfWeek = firstDate.getDay()

    // Pad the first week with empty days if it doesn't start on Sunday
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({ date: '', count: -1 }) // -1 = empty
    }

    contributions.forEach(c => {
      currentWeek.push(c)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    // Push remaining days
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    // Extract month labels
    const months: { label: string; col: number }[] = []
    let lastMonth = ''
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find(d => d.date)
      if (firstValidDay?.date) {
        const date = new Date(firstValidDay.date)
        const monthLabel = date.toLocaleString('en-US', { month: 'short' })
        if (monthLabel !== lastMonth) {
          months.push({ label: monthLabel, col: weekIndex })
          lastMonth = monthLabel
        }
      }
    })

    return { weeks, months }
  }, [contributions])

  const getColor = (count: number) => {
    if (count < 0) return 'transparent'
    if (count === 0) return 'rgba(255, 255, 255, 0.03)'

    // Leftway yellow #FCC800 with varying opacity
    const maxCount = Math.max(...contributions.map(c => c.count), 1)
    const intensity = Math.min(count / maxCount, 1)

    if (intensity <= 0.25) return 'rgba(252, 200, 0, 0.2)'
    if (intensity <= 0.5) return 'rgba(252, 200, 0, 0.4)'
    if (intensity <= 0.75) return 'rgba(252, 200, 0, 0.6)'
    return 'rgba(252, 200, 0, 0.9)'
  }

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-2 ml-8">
        {months.map((month, i) => (
          <div
            key={i}
            className="text-white/30 text-[10px]"
            style={{
              position: 'relative',
              left: `${month.col * 13}px`,
              marginRight: i < months.length - 1 ? `${(months[i + 1]?.col - month.col - 1) * 13}px` : 0,
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* Graph grid */}
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-2">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[11px] text-white/30 text-[10px] leading-[11px]">
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-0.5">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-0.5">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className="w-[11px] h-[11px] rounded-sm cursor-pointer transition-all hover:ring-1 hover:ring-white/30"
                  style={{ backgroundColor: getColor(day.count) }}
                  onMouseEnter={() => day.count >= 0 && setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
        <div className="text-white/30 text-xs">
          Less
        </div>
        <div className="flex gap-0.5">
          <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }} />
          <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: 'rgba(252, 200, 0, 0.2)' }} />
          <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: 'rgba(252, 200, 0, 0.4)' }} />
          <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: 'rgba(252, 200, 0, 0.6)' }} />
          <div className="w-[11px] h-[11px] rounded-sm" style={{ backgroundColor: 'rgba(252, 200, 0, 0.9)' }} />
        </div>
        <div className="text-white/30 text-xs">
          More
        </div>
      </div>

      {/* Tooltip */}
      {hoveredDay && (
        <div className="mt-3 text-center">
          <span className="text-white/60 text-sm" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
            {hoveredDay.count} commit{hoveredDay.count !== 1 ? 's' : ''} on{' '}
            {new Date(hoveredDay.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
      )}
    </div>
  )
}
