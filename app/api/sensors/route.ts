// app/api/sensors/route.ts
import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/utils/supabase'

export const revalidate = 0 

export async function GET() {
  try {
    const supabase = await getSupabaseServer()
    
    const { data: logs, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) // Fetching more records for the historical table tab

    if (error) throw error

    return NextResponse.json({ success: true, logs })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}