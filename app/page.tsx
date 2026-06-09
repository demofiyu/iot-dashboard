// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Thermometer, Droplets, Flame, CloudRain, Wind, ShieldAlert, RotateCw } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [logs, setLogs] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'table'>('overview')
  const [trendRange, setTrendRange] = useState<'hourly' | 'weekly' | 'monthly' | 'yearly'>('hourly')
  const [countdown, setCountdown] = useState<number>(120)

  // Track flipped cards states by their identifier keys
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({})

  const toggleFlip = (cardKey: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }))
  }

  const fetchData = async () => {
    try {
      const res = await fetch('/api/sensors')
      const result = await res.json()
      if (result.success) {
        setLogs(result.logs)
        setError(null)
      } else {
        setError(result.error)
      }
    } catch (err: any) {
      setError('Failed to fetch snapshot records.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrends = async () => {
    try {
      const res = await fetch(`/api/sensors/trends?range=${trendRange}`)
      const result = await res.json()
      if (result.success) {
        setTrends(result.trends)
      }
    } catch (err) {
      console.error('Error parsing trend models:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const dataInterval = setInterval(fetchData, 120000)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 120))
    }, 1000)

    return () => {
      clearInterval(dataInterval)
      clearInterval(countdownInterval)
    }
  }, [])

  useEffect(() => {
    fetchTrends()
  }, [trendRange, activeTab])

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 p-4">
        <div className="text-center animate-pulse">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-xs font-mono tracking-widest">SYNCHRONIZING READINGS...</p>
        </div>
      </div>
    )
  }

  const latest = logs[0] || {}

  const getHIStatus = (val: number) => {
    if (val >= 41) return { label: 'Dangerous', color: 'text-rose-600' }
    if (val >= 32) return { label: 'Extreme Caution', color: 'text-amber-500' }
    if (val >= 27) return { label: 'Caution', color: 'text-yellow-600' }
    return { label: 'Comfortable', color: 'text-emerald-500' }
  }

  const getDPStatus = (val: number) => {
    if (val >= 20) return { label: 'Very Humid', color: 'text-cyan-600' }
    if (val >= 15) return { label: 'Humid', color: 'text-blue-500' }
    return { label: 'Comfortable', color: 'text-emerald-500' }
  }

  const getHxStatus = (val: number) => {
    if (val >= 40) return { label: 'Extreme caution', color: 'text-rose-600' }
    if (val >= 30) return { label: 'Some discomfort', color: 'text-amber-500' }
    return { label: 'No discomfort', color: 'text-emerald-500' }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-3 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4 sm:pb-6 mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-300 to-indigo-200 bg-clip-text text-transparent">
              CLIMATE MONITORING STATION
            </h1>
            <p className="text-[10px] sm:text-xs text-indigo-400 font-mono tracking-widest mt-1 uppercase">NodeMCU + Supabase Integration</p>
          </div>
          <div className="flex items-center gap-3 bg-slate-950/60 border border-white/5 px-3 py-1.5 sm:py-2 rounded-xl self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] font-mono text-slate-400">
              Refresh In: <span className="text-emerald-400 font-bold">{Math.floor(countdown / 60)}m {countdown % 60}s</span>
            </p>
          </div>
        </header>

        {/* Tabs Control Menu */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/40 border border-white/5 rounded-xl max-w-md mb-6 sm:mb-8">
          {(['overview', 'trends', 'table'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 sm:py-2 text-[10px] sm:text-xs font-bold tracking-wider uppercase rounded-lg transition-all text-center ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-xl scale-[1.01]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'table' ? 'Logs' : tab}
            </button>
          ))}
        </div>

        {/* 1. OVERVIEW TAB PANEL */}
        {activeTab === 'overview' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* TEMPERATURE CARD */}
            <div 
              onClick={() => toggleFlip('temp')}
              className="w-full h-[145px] sm:h-[165px] [perspective:1000px] select-none"
            >
              <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards['temp'] ? '[transform:rotateY(180deg)]' : ''}`}>
                {/* Front Panel */}
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border-l-[6px] border-rose-500 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Temperature</p>
                    <Thermometer className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500 shrink-0" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                    {latest.temperature?.toFixed(1) || '0.0'}<span className="text-2xl sm:text-3xl font-light align-top ml-0.5">°C</span>
                  </h2>
                </div>
                {/* Back Panel */}
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-rose-400 tracking-wider uppercase">Information</h4>
                    <RotateCw className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Measures the current thermal intensity of the local environment captured by the on-site physical DHT22 sensor.
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Click card to return</p>
                </div>
              </div>
            </div>

            {/* HUMIDITY CARD */}
            <div 
              onClick={() => toggleFlip('hum')}
              className="w-full h-[145px] sm:h-[165px] [perspective:1000px] select-none"
            >
              <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards['hum'] ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border-l-[6px] border-emerald-400 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Humidity</p>
                    <Droplets className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400 shrink-0" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                    {latest.humidity?.toFixed(0) || '0'}<span className="text-2xl sm:text-3xl font-light align-top ml-0.5">%</span>
                  </h2>
                </div>
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-emerald-400 tracking-wider uppercase">Information</h4>
                    <RotateCw className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Represents the relative percentage of water vapor content current suspended in the ambient atmosphere.
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Click card to return</p>
                </div>
              </div>
            </div>

            {/* HEAT INDEX CARD */}
            <div 
              onClick={() => toggleFlip('hi')}
              className="w-full h-[145px] sm:h-[165px] [perspective:1000px] select-none"
            >
              <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards['hi'] ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border-l-[6px] border-amber-400 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Heat Index</p>
                    <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 shrink-0" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                    {latest.heat_index?.toFixed(1) || '0.0'}<span className="text-2xl sm:text-3xl font-light align-top ml-0.5">°C</span>
                  </h2>
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-1.5">
                    Status: <span className={`font-bold ${getHIStatus(latest.heat_index).color}`}>{getHIStatus(latest.heat_index).label}</span>
                  </p>
                </div>
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-amber-400 tracking-wider uppercase">Information</h4>
                    <RotateCw className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Combines air temperature parameters with relative humidity to calculate the human-perceived apparent thermal sensation.
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Click card to return</p>
                </div>
              </div>
            </div>

            {/* DEW POINT CARD */}
            <div 
              onClick={() => toggleFlip('dp')}
              className="w-full h-[145px] sm:h-[165px] [perspective:1000px] select-none"
            >
              <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards['dp'] ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border-l-[6px] border-cyan-400 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Dew Point</p>
                    <CloudRain className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-500 shrink-0" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                    {latest.dew_point?.toFixed(1) || '0.0'}<span className="text-2xl sm:text-3xl font-light align-top ml-0.5">°C</span>
                  </h2>
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-1.5">
                    Status: <span className={`font-bold ${getDPStatus(latest.dew_point).color}`}>{getDPStatus(latest.dew_point).label}</span>
                  </p>
                </div>
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">Information</h4>
                    <RotateCw className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    The explicit temperature mark to which current atmospheric air must be cooled down to precipitate into liquid water.
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Click card to return</p>
                </div>
              </div>
            </div>

            {/* ABSOLUTE HUMIDITY CARD */}
            <div 
              onClick={() => toggleFlip('ah')}
              className="w-full h-[145px] sm:h-[165px] [perspective:1000px] select-none"
            >
              <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards['ah'] ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border-l-[6px] border-indigo-400 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Absolute Humidity</p>
                    <Wind className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 shrink-0" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                    {latest.absolute_humidity?.toFixed(2) || '0.00'}<span className="text-xl sm:text-2xl font-normal align-top ml-1">g/m³</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium border-t border-slate-100 pt-1.5">Density of water vapor</p>
                </div>
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase">Information</h4>
                    <RotateCw className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Calculates the absolute weight/mass density of water vapor hanging within a single cubic meter volume of space.
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Click card to return</p>
                </div>
              </div>
            </div>

            {/* HUMIDEX COMFORT CARD */}
            <div 
              onClick={() => toggleFlip('hx')}
              className="w-full h-[145px] sm:h-[165px] [perspective:1000px] select-none"
            >
              <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${flippedCards['hx'] ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute w-full h-full [backface-visibility:hidden] bg-white text-slate-900 rounded-2xl p-5 sm:p-6 shadow-2xl border-l-[6px] border-purple-500 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Humidex (Comfort)</p>
                    <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 shrink-0" />
                  </div>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800">
                    {latest.humidex?.toFixed(1) || '0.0'}<span className="text-2xl sm:text-3xl font-light align-top ml-0.5">°C</span>
                  </h2>
                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-1.5">
                    Status: <span className={`font-bold ${getHxStatus(latest.humidex).color}`}>{getHxStatus(latest.humidex).label}</span>
                  </p>
                </div>
                <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-950 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-bold text-purple-400 tracking-wider uppercase">Information</h4>
                    <RotateCw className="w-4 h-4 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    An architectural index formula assessing atmospheric relative comfort levels felt by the human body.
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">Click card to return</p>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* 2. TRENDS TAB PANEL */}
        {activeTab === 'trends' && (
          <section className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-4 mb-4 gap-4">
              <div>
                <h3 className="text-sm sm:text-md font-bold tracking-wide">Historical Analytical Models</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Visualize climate drift over range segments</p>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 w-full lg:w-auto">
                {(['hourly', 'weekly', 'monthly', 'yearly'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTrendRange(range)}
                    className={`py-2 text-[10px] font-bold tracking-wider uppercase rounded-lg transition-all text-center ${
                      trendRange === range ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {range.replace('ly', '')}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-[260px] sm:h-[340px] md:h-[380px] mt-4 font-mono text-[10px] sm:text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tickMargin={8} hide={typeof window !== 'undefined' && window.innerWidth < 640} />
                  <YAxis stroke="#64748b" tickMargin={8} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Temperature" stroke="#f43f5e" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={true} animationDuration={1000} />
                  <Line type="monotone" dataKey="Humidity" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} isAnimationActive={true} animationDuration={1200} />
                  <Line type="monotone" dataKey="Heat Index" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={true} animationDuration={1400} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* 3. LOGS TABLE TAB PANEL */}
        {activeTab === 'table' && (
          <section className="bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-4 sm:px-6 py-4 border-b border-white/10 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-xs sm:text-sm tracking-wider uppercase text-slate-300">Historical Records</h3>
              <span className="text-[10px] sm:text-xs font-mono text-slate-500">Last {logs.length} entries</span>
            </div>
            
            <div className="overflow-x-auto m-1.5 sm:m-2 rounded-xl border border-white/5">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80 text-slate-400 text-[10px] sm:text-xs font-mono uppercase tracking-wider">
                    <th className="px-4 sm:px-6 py-3.5">Timestamp</th>
                    <th className="px-4 sm:px-6 py-3.5">Location</th>
                    <th className="px-4 sm:px-6 py-3.5">Temp</th>
                    <th className="px-4 sm:px-6 py-3.5">Humidity</th>
                    <th className="px-4 sm:px-6 py-3.5">Heat Index</th>
                    <th className="px-4 sm:px-6 py-3.5">Mold Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs sm:text-sm font-mono">
                  {logs.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 sm:px-6 py-3 text-slate-400 text-[11px]">{new Date(row.created_at).toLocaleString([], {month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</td>
                      <td className="px-4 sm:px-6 py-3 text-slate-200 font-sans font-medium">{row.device_location || 'N/A'}</td>
                      <td className="px-4 sm:px-6 py-3 text-rose-400 font-bold">{row.temperature?.toFixed(1)}°C</td>
                      <td className="px-4 sm:px-6 py-3 text-cyan-400 font-bold">{row.humidity?.toFixed(0)}%</td>
                      <td className="px-4 sm:px-6 py-3 text-slate-300">{row.heat_index?.toFixed(1)}°C</td>
                      <td className="px-4 sm:px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          row.mold_risk === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          row.mold_risk === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {row.mold_risk === 0 ? 'LOW' : row.mold_risk === 1 ? 'MOD' : 'HIGH'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}