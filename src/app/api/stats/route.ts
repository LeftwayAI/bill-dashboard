import { NextResponse } from 'next/server'

const VPS_API_URL = process.env.VPS_API_URL || 'http://localhost:3001'

export async function GET() {
  try {
    // Try to fetch from VPS
    const res = await fetch(`${VPS_API_URL}/api/stats`, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    })

    if (res.ok) {
      return NextResponse.json(await res.json())
    }
  } catch (e) {
    // VPS not available, return mock data
    console.error('Could not connect to VPS:', e)
  }

  // Mock/fallback data
  return NextResponse.json({
    status: 'unknown',
    uptime: '-',
    birthday: 'January 2, 2026',
    age: '2 days',
    totalMessages: 0,
    totalSessions: 0,
    totalFacts: 0,
    lastActivity: 'Unknown',
    topSenders: [],
  })
}
