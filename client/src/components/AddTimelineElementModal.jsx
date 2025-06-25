import React from 'react'
import { X, MapPin, RotateCw, Camera, Video, Plus, AlertTriangle } from 'lucide-react'
import { TIMELINE_ELEMENT_TYPES } from '../contexts/TimelineContext'

export default function AddTimelineElementModal({
  isOpen,
  onClose,
  onAdd,
  canAddWaypointMission = true,
  waypoints = [],
}) {
  const elementTypes = [
    {
      type: TIMELINE_ELEMENT_TYPES.WAYPOINT_MISSION,
      name: 'Waypoint Mission',
      description: 'Create a flight path with multiple waypoints',
      icon: <MapPin size={24} className="text-blue-500" />,
      disabled: !canAddWaypointMission,
      disabledReason: canAddWaypointMission
        ? null
        : 'Only one waypoint mission allowed per timeline',
    },
    {
      type: TIMELINE_ELEMENT_TYPES.HEADING,
      name: 'Heading',
      description: 'Rotate the drone to a specific heading',
      icon: <RotateCw size={24} className="text-green-500" />,
    },
    {
      type: TIMELINE_ELEMENT_TYPES.SHOOT_PHOTO,
      name: 'Shoot Photo',
      description: 'Take a single photo or burst of photos',
      icon: <Camera size={24} className="text-purple-500" />,
    },
    {
      type: TIMELINE_ELEMENT_TYPES.RECORD_VIDEO,
      name: 'Record Video',
      description: 'Start continuous video recording',
      icon: <Video size={24} className="text-red-500" />,
    },
  ]

  const handleAddElement = (type) => {
    try {
      onAdd(type) // Pass the type, let the parent handle element creation
      onClose()
    } catch (error) {
      console.error('Failed to create timeline element:', error)
      // You could show a toast notification here
    }
  }

  const handleClose = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Add Timeline Element</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {elementTypes.map((elementType) => (
            <button
              key={elementType.type}
              onClick={() => handleAddElement(elementType.type)}
              disabled={elementType.disabled}
              className={`w-full p-4 border rounded-lg text-left transition-all duration-200 ${
                elementType.disabled
                  ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">{elementType.icon}</div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{elementType.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{elementType.description}</p>
                  {elementType.disabled && elementType.disabledReason && (
                    <div className="flex items-center space-x-1 mt-1">
                      <AlertTriangle size={12} className="text-red-500" />
                      <p className="text-xs text-red-500">{elementType.disabledReason}</p>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <Plus size={16} className="text-gray-400" />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Select an element type to add to your mission timeline
          </p>
        </div>
      </div>
    </div>
  )
}
