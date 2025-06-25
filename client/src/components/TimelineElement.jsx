import React from 'react'
import { MapPin, RotateCw, Video, Camera, GripVertical, Trash2, Edit3, Info } from 'lucide-react'
import { getElementTypeDisplayName, getElementTypeIcon } from '../utils/timelineUtils'

export default function TimelineElement({
  element,
  index,
  onEdit,
  onDelete,
  onInfo,
  isSelected = false,
  onSelect,
  children,
}) {
  const getIcon = (type) => {
    const iconName = getElementTypeIcon(type)
    switch (iconName) {
      case 'MapPin':
        return <MapPin size={16} className="text-blue-500" />
      case 'RotateCw':
        return <RotateCw size={16} className="text-green-500" />
      case 'Video':
        return <Video size={16} className="text-red-500" />
      case 'Camera':
        return <Camera size={16} className="text-purple-500" />
      default:
        return <MapPin size={16} className="text-gray-500" />
    }
  }

  const getElementTypeColor = (type) => {
    switch (type) {
      case 'waypoint-mission':
        return 'border-blue-200 bg-blue-50'
      case 'heading':
        return 'border-green-200 bg-green-50'
      case 'record-video':
        return 'border-red-200 bg-red-50'
      case 'shoot-photo':
        return 'border-purple-200 bg-purple-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div
      className={`border rounded-md p-4 transition-all duration-200 ${
        isSelected ? 'border-blue-300 bg-blue-50 shadow-md' : getElementTypeColor(element.type)
      }`}
      onClick={() => onSelect && onSelect(element.id)}
    >
      <div className="flex flex-col space-y-4">
        {/* Element Type Row (Header) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Order Number Badge */}
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </div>

            {/* Element Type Label */}
            <div className="flex items-center space-x-2">
              {getIcon(element.type)}
              <span className="text-sm font-medium text-gray-800">
                {getElementTypeDisplayName(element.type)}
              </span>
            </div>
          </div>

          {/* Controls Section */}
          <div className="flex items-center space-x-1">
            {/* Info Button (conditional) */}
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onInfo(element)
                }}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="View Details"
              >
                <Info size={14} />
              </button>
            )}

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(element)
                }}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit Element"
              >
                <Edit3 size={14} />
              </button>
            )}

            {/* Drag Handle */}
            <div className="p-1 text-gray-400 cursor-grab active:cursor-grabbing">
              <GripVertical size={14} />
            </div>

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(element.id)
                }}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete Element"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Custom Content */}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}
