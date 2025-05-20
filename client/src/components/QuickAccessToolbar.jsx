import React, { useState } from 'react'
import {
  PlusIcon,
  LayersIcon,
  SettingsIcon,
  DownloadIcon,
  UploadIcon,
} from 'lucide-react'
import SidePanel from './SidePanel'

export default function QuickAccessToolbar ({ isMobile, isCompactMode, onModeChange, currentMode }) {
  const [activePanel, setActivePanel] = useState(null)
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [isTargetMode, setIsTargetMode] = useState(currentMode === 'target')

  const handleFileImport = () => {
    console.log('Import file clicked')
  }

  const toggleMode = () => {
    const newMode = isTargetMode ? 'waypoint' : 'target'
    setIsTargetMode(!isTargetMode)
    onModeChange(newMode)
  }

  const tools = [
    {
      icon: PlusIcon,
      label: isTargetMode ? 'Add Target' : 'Add Waypoint',
      onClick: toggleMode,
    },
    {
      icon: LayersIcon,
      label: 'Layers',
    },
    {
      icon: DownloadIcon,
      label: 'Save & Export',
      onClick: () => setActivePanel('download'),
      hasExpandedTooltip: true,
    },
  ]

  const downloadPanelContent = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <button
          onClick={handleFileImport}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <UploadIcon size={20} />
          <span>Import Flight Plan</span>
        </button>
      </div>
      <div>
        <p className="text-gray-600 mb-4">
          Choose a format to download your flight plan:
        </p>
      </div>
    </div>
  )


  return (
    <div>
      <div className="fixed left-1/2 bottom-0 -translate-x-1/2 bg-white rounded-t-lg shadow-lg p-2 space-x-2 flex flex-row">
        {tools.map((Tool, index) => (
          <div key={index} className="relative">
            {Tool.hasExpandedTooltip && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] bg-black/75 text-white px-1.5 py-0.5 rounded">
                  Save & Export
                </span>
              </div>
            )}
            <button
              className={`w-10 h-10 flex items-center justify-center rounded-lg
              transition-colors relative group
              
              ${Tool.icon === PlusIcon ? (isTargetMode ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white') : 'hover:bg-gray-100'}`}
              onClick={Tool.onClick}
            >
              {Tool.icon === PlusIcon ? (
                isTargetMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                )
              ) : (
                <Tool.icon size={20} />
              )}
              
            </button>
          </div>
        ))}
        <button
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg
          transition-colors"
          onClick={handleFileImport}
        >
          <UploadIcon size={20} />
        </button>
      </div>
      <SidePanel
        isOpen={activePanel !== null}
        onClose={() => setActivePanel(null)}
        title="Flight Plan"
        className=""
      >
        {downloadPanelContent}
      </SidePanel>
      
    </div>
  )
}
