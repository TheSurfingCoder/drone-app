import { useState, useRef } from 'react';
import React from 'react';

export default function BottomSheet() {
  const [yOffset, setYOffset] = useState(0); // Live drag offset
  const [isOpen, setIsOpen] = useState(false); // Open state
  const startYRef = useRef(null);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setYOffset(delta); // only drag down
  };

  const handleTouchEnd = () => {
    if (yOffset > 100) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
    setYOffset(0);
  };

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 sm:hidden
        bg-white rounded-t-lg shadow-lg
        transition-transform duration-300
        touch-none
        ${isOpen ? 'translate-y-0' : 'translate-y-[70%]'}
      `}
      style={{
        transform: `translateY(${yOffset}px)`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="p-4 text-sm text-center">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />
        <p>This is your bottom panel content.</p>
        <button
          className="mt-4 text-xs text-blue-600 underline"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? 'Close' : 'Open'} Panel
        </button>
      </div>
    </div>
  );
}
