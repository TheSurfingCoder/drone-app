import React, { useEffect, useState } from 'react'
import { XIcon } from 'lucide-react'

export default function SidePanel({ isOpen, onClose, title, children }){
  const [startX, setStartX] = useState(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    if (startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    if (diff > 0) {
      setOffsetX(diff)
      setIsDragging(true)
    }
  }

  const handleTouchEnd = () => {
    if (offsetX > 100) {
      onClose()
    }
    setOffsetX(0)
    setStartX(null)
    setIsDragging(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-100 flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-full md:w-[320px] bg-white shadow-lg transition-transform duration-300 ease-out`}
        style={{
          transform: isDragging ? `translateX(${offsetX}px)` : 'translateX(0)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle for mobile */}
        <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto my-2" />
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XIcon size={20} />
          </button>
        </div>
        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

