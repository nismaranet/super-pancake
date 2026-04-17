'use client'

import { useEffect, useState } from 'react'

export default function EventCountdown({ date }: any) {
  const [timeLeft, setTimeLeft] = useState<any>(null)

  useEffect(() => {
    function update() {
      const diff = new Date(date).getTime() - new Date().getTime()

      if (diff <= 0) {
        setTimeLeft(null)
        return
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24))
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const m = Math.floor((diff / (1000 * 60)) % 60)

      setTimeLeft({ d, h, m })
    }

    update()
    const interval = setInterval(update, 1000)

    return () => clearInterval(interval)
  }, [date])

  if (!timeLeft) {
    return <span className="text-red-400">Event Ended</span>
  }

  return (
    <span className="text-yellow-400">
      {timeLeft.d} Days {timeLeft.h} Hours {timeLeft.m} Minutes
    </span>
  )
}