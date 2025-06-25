import React, { useState } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { useTimeline } from '../contexts/TimelineContext'
import TimelineElement from './TimelineElement'
import AddTimelineElementModal from './AddTimelineElementModal'

export default function TimelineTab({ waypoints, onSetRootView, clearWaypoints, setActiveTab }) {
  const { elements, addElement, removeElement, canAddWaypointMission, getWaypointMission } =
    useTimeline()

  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState(null)

  const handleAddElement = (elementType) => {
    try {
      let newElement
      if (elementType === 'waypoint-mission') {
        newElement = {
          type: elementType,
          config: {
            waypoints: waypoints.map((wp) => ({ ...wp })), // Include current waypoints
          },
        }
      } else {
        newElement = {
          type: elementType,
          config: {},
        }
      }
      addElement(newElement)
      setShowAddModal(false)
    } catch (error) {
      console.error('Failed to add element:', error)
      // You could show a toast notification here
    }
  }

  const handleDeleteElement = (elementId) => {
    // Find the element being deleted
    const elementToDelete = elements.find((el) => el.id === elementId)

    // If it's a waypoint mission, clear the waypoints from the map
    if (elementToDelete && elementToDelete.type === 'waypoint-mission') {
      clearWaypoints()
    }

    removeElement(elementId)
    if (selectedElementId === elementId) {
      setSelectedElementId(null)
    }
  }

  const handleElementInfo = (element) => {
    if (element.type === 'waypoint-mission') {
      // Open waypoint panel for waypoint mission details
      onSetRootView('waypoint-panel')
      setActiveTab('settings')
    }
  }

  const handleElementSelect = (elementId) => {
    setSelectedElementId(elementId)
  }

  const getWaypointMissionInfoButton = (element) => {
    if (element.type !== 'waypoint-mission') return null

    const waypointMission = getWaypointMission()
    const hasWaypoints = waypointMission?.config?.waypoints?.length > 0

    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          handleElementInfo(element)
        }}
        disabled={!hasWaypoints}
        className={`px-3 py-1 text-xs rounded-md transition-colors ${
          hasWaypoints
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        title={hasWaypoints ? 'View Waypoint Mission Details' : 'No waypoints available'}
      >
        Waypoint Mission Information
      </button>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Mission Timeline</h3>
        </div>

        {/* Timeline Elements */}
        {elements.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <AlertTriangle size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-400">No timeline elements</p>
            <p className="text-xs text-gray-400 mt-1">
              Add your first element to start building your mission timeline
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {elements.map((element, index) => (
              <TimelineElement
                key={element.id}
                element={element}
                index={index}
                onDelete={handleDeleteElement}
                onInfo={handleElementInfo}
                isSelected={selectedElementId === element.id}
                onSelect={handleElementSelect}
              >
                {/* Custom content for each element type */}
                {element.type === 'waypoint-mission' && (
                  <div className="mt-2">
                    {getWaypointMissionInfoButton(element)}
                    <div className="text-xs text-gray-600 mt-1">
                      Waypoints: {element.config?.waypoints?.length || 0}
                    </div>
                  </div>
                )}

                {element.type === 'heading' && (
                  <div className="text-xs text-gray-600">
                    Angle: {element.config?.angle || 0}° | Velocity:{' '}
                    {element.config?.velocity || 10} m/s
                  </div>
                )}

                {element.type === 'shoot-photo' && (
                  <div className="text-xs text-gray-600">
                    Type: {element.config?.photoType || 'single'}
                    {element.config?.photoType === 'interval' && (
                      <span>
                        {' '}
                        | Count: {element.config?.photoCount || 1} | Interval:{' '}
                        {element.config?.timeInterval || 5}s
                      </span>
                    )}
                  </div>
                )}

                {element.type === 'record-video' && (
                  <div className="text-xs text-gray-600">Continuous recording</div>
                )}
              </TimelineElement>
            ))}
          </div>
        )}

        {/* Add Element Button at Bottom */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-300 text-gray-600 py-3 rounded-md transition-colors flex items-center justify-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Timeline Element</span>
          </button>
        </div>
      </div>

      {/* Add Element Modal */}
      <AddTimelineElementModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddElement}
        canAddWaypointMission={canAddWaypointMission()}
        waypoints={waypoints}
      />
    </div>
  )
}
