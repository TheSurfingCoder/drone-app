import React from 'react'
import { DownloadIcon, UploadIcon, MapPinIcon, TargetIcon } from 'lucide-react'

export default function QuickAccessToolbar({
  isMobile,
  isCompactMode,
  onModeChange,
  currentMode,
  onSave,
}) {
  const isTargetMode = currentMode === 'target'

  const handleImportClick = () => {
    // Import functionality will be implemented here
  }

  const handleFileExport = () => {
    if (onSave) {
      onSave()
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
      <ToolbarButton icon={UploadIcon} label="Import" onClick={handleImportClick} />
      <ToolbarButton icon={DownloadIcon} label="Save & Export" onClick={handleFileExport} />
    </div>
  )
}
