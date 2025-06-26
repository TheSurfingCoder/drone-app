import React from 'react'
import { MapPinIcon, TargetIcon, HomeIcon } from 'lucide-react'

export default function QuickAccessToolbar({
  isMobile,
  isCompactMode,
  onModeChange,
  currentMode,
  onSetHomeLocation,
}) {
  const isTargetMode = currentMode === 'target'

  const handleSetHomeLocation = () => {
    if (onSetHomeLocation) {
      onSetHomeLocation()
    }
  }

  const toggleMode = (mode) => {
    onModeChange(mode)
  }

  const ModeToggle = () => (
    <div className="flex flex-col bg-gray-100 p-1 rounded-lg space-y-1">
      <button
        onClick={() => toggleMode('waypoint')}
        className={`p-2 rounded-md transition-all flex items-center justify-center ${!isTargetMode ? 'bg-white text-blue-500 shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
        title="Waypoint Mode"
      >
        <MapPinIcon size={20} />
      </button>
      <button
        onClick={() => toggleMode('target')}
        className={`p-2 rounded-md transition-all flex items-center justify-center ${isTargetMode ? 'bg-white text-red-500 shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
        title="Target Mode"
      >
        <TargetIcon size={20} />
      </button>
    </div>
  )

  const ToolbarButton = ({ icon: Icon, label, onClick }) => (
    <button
      onClick={onClick}
      className="w-9 h-14 flex flex-col items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Icon size={18} />
      <span className="text-[10px] leading-tight mt-0.5 text-center">{label}</span>
    </button>
  )

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 bg-white rounded-r-lg shadow-lg p-2 flex flex-col items-center space-y-3">
      <ModeToggle />
      <ToolbarButton icon={HomeIcon} label="Set Home Location" onClick={handleSetHomeLocation} />
    </div>
  )
}
