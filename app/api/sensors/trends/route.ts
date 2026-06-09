// app/api/sensors/trends/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/utils/supabase'

export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('range') || 'hourly'
    const supabase = await getSupabaseServer()

    let interval = '1 hour'
    let limitCount = 24 // Default to last 24 hours

    if (filter === 'weekly') {
      interval = '1 day'
      limitCount = 7
    } else if (filter === 'monthly') {
      interval = '1 day'
      limitCount = 30
    } else if (filter === 'yearly') {
      interval = '1 month'
      limitCount = 12
    }

    // Advanced Postgres query using data binning to group and average values automatically
    const { data, error } = await supabase
      .rpc('get_sensor_trends', { 
        time_bucket_interval: interval, 
        limit_rows: limitCount 
      })

    // Fallback: If you haven't deployed the database function yet, fetch raw logs
    if (error) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('sensor_data')
        .select('created_at, temperature, humidity, heat_index')
        .order('created_at', { ascending: false })
        .limit(limitCount * 4) // Fetch slightly dense rows to sort inside client

      if (fallbackError) throw fallbackError
      
      // Clean up records chronologically for chart display lines (Left to Right)
      const formatted = [...(fallbackData || [])].reverse().map(row => ({
        label: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        Temperature: row.temperature,
        Humidity: row.humidity,
        'Heat Index': row.heat_index
      }))
      return NextResponse.json({ success: true, trends: formatted })
    }

    return NextResponse.json({ success: true, trends: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}