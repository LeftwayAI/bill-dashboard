import { NextResponse } from 'next/server'

// VPS stats API - set this env var in Vercel to your VPS IP:port
// Example: http://178.156.215.185:3001
const VPS_API_URL = process.env.VPS_API_URL || 'http://localhost:3001'

export async function GET() {
  try {
    // Fetch from VPS stats API
    const res = await fetch(`${VPS_API_URL}/api/stats`, {
      cache: 'no-store', // Always get fresh data
      headers: {
        'Accept': 'application/json',
      },
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json(data)
    }

    console.error('[Stats API] VPS returned non-OK status:', res.status)
  } catch (e) {
    console.error('[Stats API] Could not connect to VPS:', e)
  }

  // Fallback when VPS not reachable
  return NextResponse.json({
    status: 'offline',
    uptime: '-',
    birthday: 'January 2, 2026',
    age: '-',
    totalMessages: 0,
    totalSessions: 0,
    totalFacts: 0,
    lastActivity: 'Unknown',
    topSenders: [],
    error: 'Could not connect to VPS',
  })
}
