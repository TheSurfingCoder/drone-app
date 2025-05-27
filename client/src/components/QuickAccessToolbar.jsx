import React, { useState } from 'react'
import {
  LayersIcon,
  DownloadIcon,
  UploadIcon,
  MapPinIcon,
  TargetIcon,
} from 'lucide-react'
import SidePanel from './SidePanel'

export default function QuickAccessToolbar({ isMobile, isCompactMode, onModeChange, currentMode }) {
  const isTargetMode = currentMode === 'target'

  const handleFileImport = () => {
    console.log('Import file clicked')
  }

  const handleFileExport = () => {
    console.log('Export file clicked')
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
      className="w-14 h-14 flex flex-col items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors px-1 py-1"
    >
      <Icon size={20} />
      <span className="text-[10px] leading-tight text-center mt-1">{label}</span>
    </button>
  )

  return (
    <div>
      <div className="fixed left-0 top-1/2 -translate-y-1/2 bg-white rounded-r-lg shadow-lg p-2 flex flex-col items-center space-y-3">
        <ModeToggle />
        <ToolbarButton icon={UploadIcon} label="Import" onClick={handleFileImport} />
        <ToolbarButton icon={DownloadIcon} label="Save & Export" onClick={handleFileExport} />
      </div>
    </div>
  )
}
