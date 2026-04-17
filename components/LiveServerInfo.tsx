'use client'

import { useEffect, useState } from 'react'

export default function LiveServerInfo({ apiUrl }: any) {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)

  // 🧠 FORMAT SESSION TIME
  function formatSessionTime(ms: number) {
    if (!ms) return '-'

    const totalSec = Math.floor(ms / 1000)
    const min = Math.floor(totalSec / 60)
    const sec = totalSec % 60

    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  async function fetchLive() {
    if (!apiUrl) return

    try {
      setError(false)

      const res = await fetch(
        `/api/live?url=${encodeURIComponent(apiUrl)}`
      )

      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error('Live server error', err)
      setError(true)
    }
  }

  useEffect(() => {
    fetchLive()

    const interval = setInterval(fetchLive, 30000)
    return () => clearInterval(interval)
  }, [apiUrl])

  if (!apiUrl) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-10">
        <p className="text-gray-400">No live data</p>
      </div>
    )
  }

  if (!data && !error) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-10">
        <p className="text-gray-400">Loading live server...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-10">
        <p className="text-red-400">Failed to load live data</p>
      </div>
    )
  }

  const drivers = data?.ConnectedDrivers || []

  return (
    <div className="bg-gray-800 p-6 rounded-xl mb-10">
      
      {/* 🔥 SESSION INFO */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Live Server
        </h2>

        <div className="flex gap-6 text-sm text-gray-400">
          <span>Session: {data.Name || '-'}</span>
          <span>
            Session Time:{` ${data.Time} minutes`}
          </span>
          <span className="text-green-400 font-semibold">
            {drivers.length} Online
          </span>
        </div>
      </div>

      {/* EMPTY */}
      {drivers.length === 0 ? (
        <p className="text-gray-400">No drivers online</p>
      ) : (
        <>
          {/* HEADER */}
          <div className="grid grid-cols-4 text-xs text-gray-400 mb-2 px-2">
            <span>Pos</span>
            <span>Driver</span>
            <span>Car</span>
            <span>Ping</span>
          </div>

          {/* ROWS */}
          <div className="space-y-1">
            {drivers.map((d: any, i: number) => (
              <div
                key={i}
                className={`grid grid-cols-4 text-sm p-2 rounded ${
                  d.Position === 1
                    ? 'bg-yellow-700/40'
                    : 'bg-gray-700'
                }`}
              >
                <span>#{d.Position}</span>

                <span>{d.CarInfo.DriverName}</span>

                <span>{d.CarInfo.CarName}</span>

                <span>{d.Ping}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
