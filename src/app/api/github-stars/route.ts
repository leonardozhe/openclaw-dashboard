import { NextResponse } from 'next/server'

interface GitHubRepo {
  stargazers_count: number
  full_name: string
}

// Cache for 1 hour
let cachedStars: { count: number; timestamp: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET() {
  try {
    // Check cache
    if (cachedStars && Date.now() - cachedStars.timestamp < CACHE_TTL) {
      return NextResponse.json({ 
        stars: cachedStars.count,
        cached: true 
      })
    }

    const response = await fetch('https://api.github.com/repos/leonardozhe/openclaw-dashboard', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'OpenClaw-Dashboard'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const repo: GitHubRepo = await response.json()
    const starCount = repo.stargazers_count

    // Update cache
    cachedStars = {
      count: starCount,
      timestamp: Date.now()
    }

    return NextResponse.json({ 
      stars: starCount,
      cached: false 
    })
  } catch (error) {
    console.error('Failed to fetch GitHub stars:', error)
    
    // Return cached data if available, even if expired
    if (cachedStars) {
      return NextResponse.json({ 
        stars: cachedStars.count,
        cached: true,
        error: 'Using cached data'
      })
    }

    return NextResponse.json({ 
      stars: null,
      error: 'Failed to fetch GitHub stars' 
    }, { status: 500 })
  }
}