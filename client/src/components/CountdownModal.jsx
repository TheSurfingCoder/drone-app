import React, { useState, useEffect } from 'react'

export default function CountdownModal({ message = 'Starting in', seconds = 3, onComplete }) {
  const [count, setCount] = useState(seconds)

  useEffect(() => {
    if (count === 0) {
      onComplete?.()
      return
    }

    const timeout = setTimeout(() => {
      setCount((c) => c - 1)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [count])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 text-center shadow-lg text-xl font-semibold">
        {message === 'Starting in' ? `${message} ${count}` : message}
      </div>
    </div>
  )
}
