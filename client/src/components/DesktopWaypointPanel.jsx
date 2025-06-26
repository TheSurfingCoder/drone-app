import React, { useState } from 'react'
import {
  ChevronLeftIcon,
  XIcon,
  MapPinIcon,
  Settings,
  TargetIcon,
  Info,
  Play,
  Trash2,
  Camera,
  Video,
  RotateCw,
  RotateCcw,
  Focus,
  ZoomIn,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Globe,
} from 'lucide-react'
import { getHeadingControlState } from '../utils/headingUtils'
import { validateMissionUpload } from '../utils/missionValidation'
import TimelineTab from './TimelineTab'

export default function DesktopWaypointPanel({
  waypoints,
  selectedWaypoint,
  onSelectWaypoint,
  onDeleteWaypoint,
  onModeChange,
  isDesktopCollapsed,
  setIsDesktopCollapsed,
  handleWaypointHeightChange,
  handleWaypointSpeedChange,
  handleWaypointCurvatureChange,
  handleWaypointHeadingChange,
  missionSettings,
  onMissionSettingChange,
  unitSystem,
  targets,
  headingSystem,
  onRemoveTarget,
  clearWaypoints,
  onSave,
}) {
  const [rootView, setRootView] = useState('root') // 'root', 'waypoint-panel'
  const [activeTab, setActiveTab] = useState('global-settings') // 'settings', 'waypoints', 'actions', 'target', 'timeline'
  const [showTooltip, setShowTooltip] = useState(null)
  const [actions, setActions] = useState([
    {
      id: 1,
      triggerType: 'reachPoint',
      waypointIndex: 0,
      distanceOffset: 0,
      timeMs: 0,
      missionPercent: 50,
      actuatorType: 'takePhoto',
      pitch: 0,
      yaw: 0,
      interpolationMode: 'none',
    },
  ])

  // Conversion functions
  const metersToFeet = (meters) => meters * 3.28084
  const feetToMeters = (feet) => feet / 3.28084

  // Convert height based on unit system
  const convertHeight = (height) => {
    if (unitSystem === 'imperial') {
      return metersToFeet(height)
    }
    return height
  }

  // Convert height back to meters for storage
  const convertHeightToMeters = (height) => {
    if (unitSystem === 'imperial') {
      return feetToMeters(height)
    }
    return height
  }

  // Get the appropriate unit label
  const getUnitLabel = () => (unitSystem === 'imperial' ? 'ft' : 'm')

  // Get max height based on unit system
  const getMaxHeight = () => (unitSystem === 'imperial' ? 328 : 100) // 100m = ~328ft

  // Action management functions
  const addAction = () => {
    const newAction = {
      id: Date.now(),
      triggerType: 'reachPoint',
      waypointIndex: 0,
      distanceOffset: 0,
      timeMs: 0,
      missionPercent: 50,
      actuatorType: 'takePhoto',
      pitch: 0,
      yaw: 0,
      interpolationMode: 'none',
    }
    setActions([...actions, newAction])
  }

  const deleteAction = (id) => {
    setActions(actions.filter((action) => action.id !== id))
  }

  const updateAction = (id, field, value) => {
    setActions(actions.map((action) => (action.id === id ? { ...action, [field]: value } : action)))
  }

  const getActuatorIcon = (actuatorType) => {
    switch (actuatorType) {
      case 'takePhoto':
        return <Camera size={14} />
      case 'startRecording':
        return <Video size={14} />
      case 'stopRecording':
        return <Video size={14} />
      case 'rotateGimbal':
        return <RotateCw size={14} />
      case 'rotateAircraft':
        return <RotateCcw size={14} />
      case 'focus':
        return <Focus size={14} />
      case 'zoom':
        return <ZoomIn size={14} />
      case 'custom':
        return <Zap size={14} />
      default:
        return <Zap size={14} />
    }
  }

  const validateAction = (action) => {
    const errors = []

    if (action.triggerType === 'reachPoint' || action.triggerType === 'distanceToPoint') {
      if (action.waypointIndex < 0 || action.waypointIndex >= waypoints.length) {
        errors.push('Invalid waypoint selection')
      }
    }

    if (action.triggerType === 'distanceToPoint') {
      if (action.distanceOffset === 0) {
        errors.push('Distance offset cannot be 0')
      }
    }

    if (action.triggerType === 'timeBased') {
      if (action.timeMs < 0) {
        errors.push('Time must be positive')
      }
    }

    if (action.triggerType === 'trajectory') {
      if (action.missionPercent < 0 || action.missionPercent > 100) {
        errors.push('Mission progress must be between 0-100%')
      }
    }

    if (action.actuatorType === 'rotateGimbal') {
      if (action.pitch < -90 || action.pitch > 30) {
        errors.push('Gimbal pitch must be between -90° and +30°')
      }
    }

    if (action.actuatorType === 'rotateAircraft') {
      if (action.yaw < -180 || action.yaw > 180) {
        errors.push('Aircraft yaw must be between -180° and +180°')
      }
    }

    return errors
  }

  const getTotalElevation = (wp) => {
    const totalMeters = (wp.groundHeight ?? 0) + (wp.height ?? 0)
    return unitSystem === 'imperial' ? metersToFeet(totalMeters) : totalMeters
  }

  const handleWaypointClick = (id) => {
    const el = document.getElementById(`waypoint-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })

    onSelectWaypoint(id)
  }

  const Tooltip = ({ children, content, position = 'top' }) => (
    <div className="relative inline-block">
      <div
        className="inline-flex items-center"
        onMouseEnter={() => setShowTooltip(content)}
        onMouseLeave={() => setShowTooltip(null)}
      >
        {children}
        <Info size={14} className="ml-1 text-gray-400 hover:text-gray-600 cursor-help" />
      </div>
      {showTooltip === content && (
        <div
          className={`absolute z-50 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg ${
            position === 'top'
              ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-2'
              : 'top-full left-1/2 transform -translate-x-1/2 mt-2'
          }`}
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${
              position === 'top'
                ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1'
                : 'bottom-full left-1/2 -translate-x-1/2 translate-y-1'
            }`}
          ></div>
        </div>
      )}
    </div>
  )

  // Heading control state
  const headingControl = getHeadingControlState({
    headingMode: missionSettings.headingMode,
    actions,
    poiTarget: targets.length > 0 ? targets[0] : null,
  })

  // Mission validation
  const validationResult = validateMissionUpload(missionSettings, targets, waypoints, actions)

  const renderTabContent = () => {
    switch (activeTab) {
      case 'waypoints':
        return (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {waypoints.map((wp, i) => (
              <div
                key={wp.id}
                id={`waypoint-${wp.id}`}
                className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  selectedWaypoint === wp.id
                    ? 'border-blue-300 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => handleWaypointClick(wp.id)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        selectedWaypoint === wp.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span className="font-medium text-gray-800">Waypoint #{i + 1}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteWaypoint(wp.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-md font-medium transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                  <div>
                    <div className="text-[10px] uppercase">Lat</div>
                    <div className="font-mono">{wp.lat?.toFixed(5)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase">Lng</div>
                    <div className="font-mono">{wp.lng?.toFixed(5)}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <div className="flex justify-between mb-1">
                    <span>Ground Height</span>
                    <span>
                      {convertHeight(wp.groundHeight ?? 0).toFixed(1)} {getUnitLabel()}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  <div className="flex justify-between mb-1">
                    <span>Height</span>
                    <span>
                      {convertHeight(wp.height).toFixed(1)} {getUnitLabel()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={getMaxHeight()}
                    step={unitSystem === 'imperial' ? '1' : '0.5'}
                    value={convertHeight(wp.height)}
                    onChange={(e) =>
                      handleWaypointHeightChange(
                        wp.id,
                        convertHeightToMeters(parseFloat(e.target.value)),
                      )
                    }
                    className="w-full"
                  />
                </div>

                <div className="text-xs text-green-700 mb-2">
                  <div className="flex justify-between">
                    <span>Total Elevation</span>
                    <span className="font-semibold text-green-800">
                      {getTotalElevation(wp).toFixed(1)} {getUnitLabel()}
                    </span>
                  </div>
                </div>

                {/* Speed Control */}
                <div className="text-xs text-gray-600 mb-2">
                  <Tooltip content="🎯 Per-Waypoint Speed: The speed the drone uses after this waypoint until the next one. This overrides the global Auto Flight Speed just for this segment.">
                    <div className="flex justify-between mb-1">
                      <span>Speed</span>
                      <span className="font-mono">{(wp.speed ?? 10).toFixed(1)} m/s</span>
                    </div>
                  </Tooltip>
                  <input
                    type="range"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={wp.speed ?? 10}
                    onChange={(e) => handleWaypointSpeedChange(wp.id, parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0.1</span>
                    <span>20 m/s</span>
                  </div>
                </div>

                {/* Curvature Control */}
                {missionSettings.flightPathMode === 'CURVED' ? (
                  <div className="text-xs text-gray-600 mb-2">
                    <Tooltip content="🎯 Corner Radius: Controls the curvature direction and tightness. Negative values create inward curves, positive values create outward curves. Range: -50 to 100m per DJI SDK.">
                      <div className="flex justify-between mb-1">
                        <span>Corner Radius</span>
                        <span
                          className={`font-mono ${(wp.cornerRadius ?? 0.2) < 0 ? 'text-red-600' : 'text-blue-600'}`}
                        >
                          {(wp.cornerRadius ?? 0.2).toFixed(1)} m
                          {(wp.cornerRadius ?? 0.2) < 0 ? ' (Inward)' : ' (Outward)'}
                        </span>
                      </div>
                    </Tooltip>
                    <input
                      type="range"
                      min="-50"
                      max="100"
                      step="0.1"
                      value={wp.cornerRadius ?? 0.2}
                      onChange={(e) =>
                        handleWaypointCurvatureChange(wp.id, parseFloat(e.target.value))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Inward (-50m)</span>
                      <span>Outward (100m)</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 mb-2">
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-xs text-gray-600">
                        ⚠️ Curvature control disabled in Normal mode. Switch to Curved mode to
                        enable corner radius settings.
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-600 mb-2">
                  <div className="flex justify-between">
                    <span>Heading</span>
                    <span className="font-mono">
                      {typeof wp.heading === 'number' ? `${wp.heading.toFixed(1)}°` : '—'}
                    </span>
                  </div>
                </div>

                {/* Per-Waypoint Heading Control - Only enabled for USING_WAYPOINT_HEADING mode */}
                {headingControl.perWaypointHeadingEnabled ? (
                  <div className="text-xs text-gray-600 mb-2">
                    <div className="flex justify-between mb-1">
                      <span>Set Heading</span>
                      <span className="font-mono">{(wp.waypointHeading ?? 0).toFixed(1)}°</span>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={wp.waypointHeading ?? 0}
                      onChange={(e) => {
                        const newHeading = parseFloat(e.target.value)
                        handleWaypointHeadingChange(wp.id, newHeading)
                      }}
                      className="w-full"
                      disabled={!headingControl.perWaypointHeadingEnabled}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>-180°</span>
                      <span>+180°</span>
                    </div>
                  </div>
                ) : headingControl.warning ? (
                  <div className="text-xs text-gray-600 mb-2">
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs text-yellow-700">⚠️ {headingControl.warning}</p>
                    </div>
                  </div>
                ) : null}

                <div className="text-xs text-gray-600 mb-2">
                  <div className="flex justify-between">
                    <span>Pitch</span>
                    <span className="font-mono">
                      {typeof wp.pitch === 'number' ? `${wp.pitch.toFixed(1)}°` : '—'}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>POI Status</span>
                    <span>{targets.length > 0 ? 'Active' : 'None'}</span>
                  </div>
                  <button
                    onClick={() => onModeChange('target')}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {targets.length > 0 ? 'Manage POI' : 'Add POI Target'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      case 'settings':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Global Mission Settings</h3>

              {/* Auto Flight Speed */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Tooltip content="🚀 Cruise Speed: The default speed the drone uses between waypoints unless overridden. Used when no specific speed is assigned for a segment. Per-waypoint speed takes priority if defined.">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Flight Speed
                  </label>
                </Tooltip>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={missionSettings.autoFlightSpeed}
                    onChange={(e) =>
                      onMissionSettingChange('autoFlightSpeed', parseFloat(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-gray-600 min-w-[60px]">
                    {missionSettings.autoFlightSpeed} m/s
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Default cruise speed</p>
              </div>

              {/* Max Flight Speed */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Tooltip content="🔐 Max Flight Speed: The upper speed limit that the pilot can override manually during the mission (e.g., pushing the stick forward). Think of this as the ceiling; the drone won't go faster than this even if you try.">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Flight Speed
                  </label>
                </Tooltip>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="0.5"
                    value={missionSettings.maxFlightSpeed}
                    onChange={(e) =>
                      onMissionSettingChange('maxFlightSpeed', parseFloat(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-gray-600 min-w-[60px]">
                    {missionSettings.maxFlightSpeed} m/s
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max allowed speed when user pushes the stick
                </p>
              </div>

              {/* Speed Priority Explanation */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  🧠 How Speed Settings Work Together
                </h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>
                    <strong>Priority Order:</strong>
                  </p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>
                      <strong>Per-Waypoint Speed</strong> (if defined) - Overrides global cruise
                      speed for that segment
                    </li>
                    <li>
                      <strong>Auto Flight Speed</strong> - Default cruise speed when no per-waypoint
                      speed is set
                    </li>
                    <li>
                      <strong>Max Flight Speed</strong> - Absolute ceiling that cannot be exceeded
                    </li>
                  </ol>
                  <p className="mt-2 text-blue-600">
                    <strong>Example:</strong> If autoFlightSpeed = 10 m/s, maxFlightSpeed = 15 m/s,
                    and a waypoint has speed = 8 m/s, the drone will fly at 8 m/s for that segment.
                  </p>
                </div>
              </div>

              {/* Finished Action */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Finished Action
                </label>
                <select
                  value={missionSettings.finishedAction}
                  onChange={(e) => onMissionSettingChange('finishedAction', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="GO_HOME">Go Home</option>
                  <option value="HOVER">Hover</option>
                  <option value="LAND">Land</option>
                  <option value="GO_TO_FIRST_WAYPOINT">Go to First Waypoint</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  What the drone should do after the mission ends
                </p>
              </div>

              {/* Repeat Times */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Times</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={missionSettings.repeatTimes}
                    onChange={(e) =>
                      onMissionSettingChange('repeatTimes', parseInt(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-gray-600 min-w-[40px]">
                    {missionSettings.repeatTimes}x
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Number of times to repeat the entire mission
                </p>
              </div>

              {/* Global Turn Mode */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Global Turn Mode
                </label>
                <select
                  value={missionSettings.globalTurnMode}
                  onChange={(e) => onMissionSettingChange('globalTurnMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="CLOCKWISE">Clockwise</option>
                  <option value="COUNTER_CLOCKWISE">Counter Clockwise</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Default yaw direction for aircraft turns
                </p>
              </div>

              {/* Gimbal Pitch Rotation Enabled */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Gimbal Pitch Rotation
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Enables per-waypoint gimbal pitch control
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onMissionSettingChange(
                        'gimbalPitchRotationEnabled',
                        !missionSettings.gimbalPitchRotationEnabled,
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      missionSettings.gimbalPitchRotationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        missionSettings.gimbalPitchRotationEnabled
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Heading Mode */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Heading Mode</label>
                <select
                  value={missionSettings.headingMode}
                  onChange={(e) => onMissionSettingChange('headingMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="AUTO">Auto (face next waypoint)</option>
                  <option value="USING_INITIAL_DIRECTION">Using Initial Direction</option>
                  <option value="CONTROL_BY_REMOTE_CONTROLLER">Control by Remote Controller</option>
                  <option value="USING_WAYPOINT_HEADING">Using Waypoint Heading</option>
                  <option value="TOWARD_POINT_OF_INTEREST">Toward Point of Interest</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">How the aircraft faces during flight</p>
              </div>

              {/* Flight Path Mode */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Tooltip content="🛤️ Flight Path Mode: Controls how the drone flies between waypoints. NORMAL uses straight lines, CURVED allows rounded turns with corner radius settings.">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Path Mode
                  </label>
                </Tooltip>
                <select
                  value={missionSettings.flightPathMode}
                  onChange={(e) => onMissionSettingChange('flightPathMode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="NORMAL">Normal (Straight Lines)</option>
                  <option value="CURVED">Curved (Rounded Turns)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {missionSettings.flightPathMode === 'NORMAL'
                    ? 'Uses straight line paths between waypoints'
                    : 'Enables curved paths with corner radius control'}
                </p>
              </div>
            </div>
          </div>
        )
      case 'target':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Point of Interest (POI)
                </h3>

                {targets.length === 0 ? (
                  <div className="text-center text-gray-500 py-6">
                    <TargetIcon size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-sm text-gray-600 mb-2">No POI Target Set</p>
                    <p className="text-xs text-gray-400 mb-4">
                      Add a target to use as the Point of Interest for all waypoints
                    </p>
                    <button
                      onClick={() => onModeChange('target')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Add POI Target
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {targets.map((target) => (
                      <div
                        key={target.id}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <TargetIcon size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-gray-800">
                              POI Target #{target.id}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {target.lat.toFixed(6)}, {target.lng.toFixed(6)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <strong>Status:</strong> Active POI for all waypoints
                          </p>
                          <p>
                            <strong>Heading Mode:</strong>{' '}
                            {missionSettings.headingMode === 'TOWARD_POINT_OF_INTEREST'
                              ? 'Enabled'
                              : 'Disabled'}
                          </p>
                          <p>
                            <strong>Waypoints Focused:</strong>{' '}
                            {waypoints.filter((wp) => wp.focusTargetId === target.id).length} of{' '}
                            {waypoints.length}
                          </p>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => onModeChange('target')}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            Move Target
                          </button>
                          <button
                            onClick={() => {
                              if (onRemoveTarget) {
                                onRemoveTarget()
                              }
                            }}
                            className="text-red-600 hover:text-red-800 text-xs underline"
                          >
                            Remove POI
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">🎯 How POI Works</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>
                    <strong>Single POI System:</strong> All waypoints automatically focus on the
                    same target
                  </p>
                  <p>
                    <strong>Heading Control:</strong> When &quot;Toward Point of Interest&quot; mode
                    is enabled, all waypoints will face the POI
                  </p>
                  <p>
                    <strong>No Per-Waypoint Selection:</strong> You can no longer choose which
                    waypoints focus on which targets
                  </p>
                  <p>
                    <strong>Global Focus:</strong> The POI target affects the entire mission
                    uniformly
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'actions':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Mission Actions</h3>
                <button
                  onClick={addAction}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  <span>+</span>
                  <span>Add Action</span>
                </button>
              </div>

              {actions.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  <Play size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-400">No actions configured</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add your first action to define mission triggers
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {actions.map((action, index) => {
                    const errors = validateAction(action)
                    return (
                      <div
                        key={action.id}
                        className={`bg-white rounded-lg border ${errors.length > 0 ? 'border-red-300' : 'border-gray-200'} p-2 hover:shadow-sm transition-shadow`}
                      >
                        <div className="flex items-start space-x-2">
                          {/* Bullet point */}
                          <div
                            className={`w-2 h-2 ${errors.length > 0 ? 'bg-red-500' : 'bg-blue-500'} rounded-full mt-2 flex-shrink-0`}
                          ></div>

                          {/* Action content */}
                          <div className="flex-1 space-y-2">
                            {/* Validation errors */}
                            {errors.length > 0 && (
                              <div className="bg-red-50 border border-red-200 rounded px-2 py-1">
                                <p className="text-xs text-red-600 font-medium">
                                  Validation Errors:
                                </p>
                                <ul className="text-xs text-red-600 mt-1">
                                  {errors.map((error, idx) => (
                                    <li key={idx}>• {error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Trigger section */}
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-600 w-12">When:</span>
                              <div className="flex items-center space-x-1 flex-1">
                                <select
                                  value={action.triggerType}
                                  onChange={(e) =>
                                    updateAction(action.id, 'triggerType', e.target.value)
                                  }
                                  className="text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                                >
                                  <option value="reachPoint">Reach waypoint</option>
                                  <option value="distanceToPoint">
                                    Reach waypoint with offset
                                  </option>
                                  <option value="timeBased">Time after mission start</option>
                                  <option value="trajectory">Mission progress</option>
                                </select>

                                {/* Conditional trigger inputs */}
                                {(action.triggerType === 'reachPoint' ||
                                  action.triggerType === 'distanceToPoint') && (
                                  <select
                                    value={action.waypointIndex}
                                    onChange={(e) =>
                                      updateAction(
                                        action.id,
                                        'waypointIndex',
                                        parseInt(e.target.value),
                                      )
                                    }
                                    className="text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
                                  >
                                    {waypoints.map((_, idx) => (
                                      <option key={idx} value={idx}>
                                        WP {idx + 1}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {action.triggerType === 'distanceToPoint' && (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      value={action.distanceOffset}
                                      onChange={(e) =>
                                        updateAction(
                                          action.id,
                                          'distanceOffset',
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="0"
                                      className="w-12 text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      title="Distance offset in meters (positive = after waypoint, negative = before waypoint)"
                                    />
                                    <span className="text-xs text-gray-600">m</span>
                                  </div>
                                )}

                                {action.triggerType === 'timeBased' && (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      value={action.timeMs}
                                      onChange={(e) =>
                                        updateAction(
                                          action.id,
                                          'timeMs',
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="0"
                                      className="w-16 text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      title="Time in milliseconds after mission start"
                                    />
                                    <span className="text-xs text-gray-600">ms</span>
                                  </div>
                                )}

                                {action.triggerType === 'trajectory' && (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={action.missionPercent}
                                      onChange={(e) =>
                                        updateAction(
                                          action.id,
                                          'missionPercent',
                                          parseInt(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="50"
                                      className="w-12 text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      title="Mission completion percentage (0-100%)"
                                    />
                                    <span className="text-xs text-gray-600">%</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Actuator section */}
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-medium text-gray-600 w-12">Do:</span>
                              <div className="flex items-center space-x-1 flex-1">
                                {getActuatorIcon(action.actuatorType)}
                                <select
                                  value={action.actuatorType}
                                  onChange={(e) =>
                                    updateAction(action.id, 'actuatorType', e.target.value)
                                  }
                                  className="text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                                  disabled={
                                    !headingControl.rotateAircraftEnabled &&
                                    action.actuatorType === 'rotateAircraft'
                                  }
                                >
                                  <option value="takePhoto">Take Photo</option>
                                  <option value="startRecording">Start Recording</option>
                                  <option value="stopRecording">Stop Recording</option>
                                  <option value="rotateGimbal">Rotate Gimbal</option>
                                  <option
                                    value="rotateAircraft"
                                    disabled={!headingControl.rotateAircraftEnabled}
                                  >
                                    Rotate Aircraft
                                  </option>
                                  <option value="focus">Adjust Focus</option>
                                  <option value="zoom">Adjust Zoom</option>
                                  <option value="custom">Custom Action</option>
                                </select>

                                {/* Rotate Aircraft warning */}
                                {action.actuatorType === 'rotateAircraft' &&
                                  headingControl.rotateAircraftWarning && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-xs text-yellow-600">⚠️</span>
                                      <span className="text-xs text-yellow-600">
                                        {headingControl.rotateAircraftWarning}
                                      </span>
                                    </div>
                                  )}

                                {/* Conditional actuator inputs */}
                                {action.actuatorType === 'rotateGimbal' && (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min="-90"
                                      max="30"
                                      value={action.pitch}
                                      onChange={(e) =>
                                        updateAction(
                                          action.id,
                                          'pitch',
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="0"
                                      className="w-12 text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      title="Gimbal pitch angle (-90° to +30°)"
                                    />
                                    <span className="text-xs text-gray-600">°</span>
                                  </div>
                                )}

                                {action.actuatorType === 'rotateAircraft' && (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      min="-180"
                                      max="180"
                                      value={action.yaw}
                                      onChange={(e) =>
                                        updateAction(
                                          action.id,
                                          'yaw',
                                          parseFloat(e.target.value) || 0,
                                        )
                                      }
                                      placeholder="0"
                                      className="w-12 text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      title="Aircraft yaw angle (-180° to +180°)"
                                    />
                                    <span className="text-xs text-gray-600">°</span>
                                  </div>
                                )}

                                {/* Interpolation mode for gimbal and aircraft rotation */}
                                {(action.actuatorType === 'rotateGimbal' ||
                                  action.actuatorType === 'rotateAircraft') && (
                                  <select
                                    value={action.interpolationMode}
                                    onChange={(e) =>
                                      updateAction(action.id, 'interpolationMode', e.target.value)
                                    }
                                    className="text-xs border border-gray-300 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
                                    title="Interpolation mode for smooth rotation"
                                  >
                                    <option value="none">No interpolation</option>
                                    <option value="linear">Linear</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={() => deleteAction(action.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-500 hover:text-red-700 transition-colors"
                            title="Delete action"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      case 'global-settings':
        return (
          <div className="p-4 space-y-6">
            {/* Flight Information Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Globe size={18} className="mr-2 text-blue-500" />
                Flight Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flight Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Beach Survey Flight"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={missionSettings.flightName || ''}
                    onChange={(e) => onMissionSettingChange('flightName', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Identifies the mission when saving flights
                  </p>
                </div>
              </div>
            </div>

            {/* Home Location Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Home Location</h3>
              <p className="text-sm text-gray-600 mb-4">
                Defines the return point for RTH (Return to Home)
              </p>

              {missionSettings.homeLat && missionSettings.homeLng ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                      {missionSettings.homeLat.toFixed(6)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                      {missionSettings.homeLng.toFixed(6)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-sm">
                    Click the home icon in the toolbar, then click on the map to set home location
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Use the home icon in the toolbar to set location on map
              </p>
            </div>

            {/* Drone Type Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Drone Type</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Drone Model
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={missionSettings.droneType || ''}
                  onChange={(e) => onMissionSettingChange('droneType', e.target.value)}
                >
                  <option value="">Select a drone model</option>

                  {/* Enterprise */}
                  <optgroup label="Enterprise">
                    <option value="M350_RTK">M350 RTK</option>
                    <option value="M300_RTK">M300 RTK</option>
                    <option value="MAVIC_2_ENTERPRISE_ADVANCED">MAVIC 2 Enterprise Advanced</option>
                    <option value="MAVIC_2_ENTERPRISE_DUAL">MAVIC 2 Enterprise Dual</option>
                    <option value="MAVIC_2_ENTERPRISE">MAVIC 2 ENTERPRISE</option>
                  </optgroup>

                  {/* Consumer */}
                  <optgroup label="Consumer">
                    <option value="DJI_MINI_2">DJI MINI 2</option>
                    <option value="DJI_MINI_SE">DJI MINI SE</option>
                    <option value="DJI_AIR_2S">DJI AIR 2S</option>
                    <option value="MAVIC_AIR_2">MAVIC AIR 2</option>
                    <option value="MAVIC_MINI">MAVIC MINI</option>
                    <option value="MAVIC_2_SERIES">MAVIC 2 SERIES</option>
                    <option value="MAVIC_AIR">MAVIC AIR</option>
                    <option value="MAVIC_PRO">MAVIC PRO</option>
                    <option value="SPARK">SPARK</option>
                  </optgroup>

                  {/* Professional */}
                  <optgroup label="Professional">
                    <option value="P4_MULTISPECTRAL">P4 Multispectral</option>
                    <option value="PHANTOM_4_RTK">PHANTOM 4 RTK</option>
                    <option value="PHANTOM_4_PRO_V2">PHANTOM 4 PRO V2</option>
                    <option value="PHANTOM_4">PHANTOM 4</option>
                  </optgroup>

                  {/* Phantom 3 Series */}
                  <optgroup label="Phantom 3 Series">
                    <option value="PHANTOM_3_PROFESSIONAL">PHANTOM 3 PROFESSIONAL</option>
                    <option value="PHANTOM_3_ADVANCED">PHANTOM 3 ADVANCED</option>
                    <option value="PHANTOM_3_STANDARD">PHANTOM 3 STANDARD</option>
                    <option value="PHANTOM_3_4K">PHANTOM 3 4K</option>
                  </optgroup>

                  {/* Industrial */}
                  <optgroup label="Industrial">
                    <option value="INSPIRE_2">INSPIRE 2</option>
                    <option value="INSPIRE_1_PRO">INSPIRE 1 PRO</option>
                    <option value="INSPIRE_1">INSPIRE 1</option>
                    <option value="M200_V2">M200 V2</option>
                    <option value="M210_RTK_V2">M210 RTK V2</option>
                    <option value="MATRICE_600_PRO">MATRICE 600 PRO</option>
                    <option value="MATRICE_600">MATRICE 600</option>
                    <option value="MATRICE_100">MATRICE 100</option>
                  </optgroup>
                </select>
              </div>
            </div>

            {/* Battery Power Level Trigger */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Battery Power Level Trigger
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Safety threshold for battery-critical actions
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action on Low Battery
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={missionSettings.batteryAction || 'return_home'}
                    onChange={(e) => onMissionSettingChange('batteryAction', e.target.value)}
                  >
                    <option value="return_home">Return to Home</option>
                    <option value="land">Land</option>
                    <option value="stop_timeline">Stop Timeline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Battery Level Threshold (%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={missionSettings.batteryThreshold || 20}
                    onChange={(e) =>
                      onMissionSettingChange('batteryThreshold', parseInt(e.target.value))
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span className="font-medium">{missionSettings.batteryThreshold || 20}%</span>
                    <span>100%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Recommended: 20-30%</p>
                </div>
              </div>
            </div>

            {/* RC Signal Lost Behavior */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">RC Signal Lost Behavior</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action on Signal Loss
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={missionSettings.signalLostAction || 'hover'}
                  onChange={(e) => onMissionSettingChange('signalLostAction', e.target.value)}
                >
                  <option value="hover">Hover: Maintain position</option>
                  <option value="landing">Landing: Initiate automatic landing</option>
                  <option value="return_home">Return to Home: Return to home point</option>
                </select>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Render root view or waypoint panel
  if (rootView === 'root') {
    return (
      <div
        className={`absolute top-[50px] right-0 bottom-0 h-[calc(100%-50px)] md:block transition-all duration-300 ease-out ${
          isDesktopCollapsed ? 'translate-x-full' : 'translate-x-0'
        }`}
      >
        <button
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-white hover:bg-gray-50 rounded-l-lg shadow-lg p-2 transition-all duration-200 border border-r-0 border-gray-200"
        >
          <ChevronLeftIcon size={20} className="text-gray-600" />
        </button>

        <div className="w-[400px] h-full bg-white rounded-l-xl shadow-2xl border-l border-gray-200 flex flex-col">
          {/* Root Tab Navigation */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Mission Control</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onSave}
                  disabled={!missionSettings.flightName || waypoints.length < 2}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Save Mission
                </button>
                <button
                  onClick={() => setIsDesktopCollapsed(true)}
                  className="p-1 hover:bg-white/50 rounded-full transition-colors duration-200"
                >
                  <XIcon size={18} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* Root Tab Buttons */}
            <div className="flex space-x-0.5">
              <button
                onClick={() => setActiveTab('global-settings')}
                className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                  activeTab === 'global-settings'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800'
                }`}
              >
                <Globe size={14} />
                <span>Global Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                  activeTab === 'timeline'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800'
                }`}
              >
                <Clock size={14} />
                <span>Timeline</span>
              </button>
            </div>
          </div>

          {/* Root Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'global-settings' && (
              <div className="p-4 space-y-6">
                {/* Flight Information Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Globe size={18} className="mr-2 text-blue-500" />
                    Flight Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flight Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Beach Survey Flight"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={missionSettings.flightName || ''}
                        onChange={(e) => onMissionSettingChange('flightName', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Identifies the mission when saving flights
                      </p>
                    </div>
                  </div>
                </div>

                {/* Home Location Section */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Home Location</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Defines the return point for RTH (Return to Home)
                  </p>

                  {missionSettings.homeLat && missionSettings.homeLng ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latitude
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                          {missionSettings.homeLat.toFixed(6)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Longitude
                        </label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                          {missionSettings.homeLng.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <p className="text-gray-500 text-sm">
                        Click the home icon in the toolbar, then click on the map to set home
                        location
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Use the home icon in the toolbar to set location on map
                  </p>
                </div>

                {/* Drone Type Selection */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Drone Type</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Drone Model
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={missionSettings.droneType || ''}
                      onChange={(e) => onMissionSettingChange('droneType', e.target.value)}
                    >
                      <option value="">Select a drone model</option>

                      {/* Enterprise */}
                      <optgroup label="Enterprise">
                        <option value="M350_RTK">M350 RTK</option>
                        <option value="M300_RTK">M300 RTK</option>
                        <option value="MAVIC_2_ENTERPRISE_ADVANCED">
                          MAVIC 2 Enterprise Advanced
                        </option>
                        <option value="MAVIC_2_ENTERPRISE_DUAL">MAVIC 2 Enterprise Dual</option>
                        <option value="MAVIC_2_ENTERPRISE">MAVIC 2 ENTERPRISE</option>
                      </optgroup>

                      {/* Consumer */}
                      <optgroup label="Consumer">
                        <option value="DJI_MINI_2">DJI MINI 2</option>
                        <option value="DJI_MINI_SE">DJI MINI SE</option>
                        <option value="DJI_AIR_2S">DJI AIR 2S</option>
                        <option value="MAVIC_AIR_2">MAVIC AIR 2</option>
                        <option value="MAVIC_MINI">MAVIC MINI</option>
                        <option value="MAVIC_2_SERIES">MAVIC 2 SERIES</option>
                        <option value="MAVIC_AIR">MAVIC AIR</option>
                        <option value="MAVIC_PRO">MAVIC PRO</option>
                        <option value="SPARK">SPARK</option>
                      </optgroup>

                      {/* Professional */}
                      <optgroup label="Professional">
                        <option value="P4_MULTISPECTRAL">P4 Multispectral</option>
                        <option value="PHANTOM_4_RTK">PHANTOM 4 RTK</option>
                        <option value="PHANTOM_4_PRO_V2">PHANTOM 4 PRO V2</option>
                        <option value="PHANTOM_4">PHANTOM 4</option>
                      </optgroup>

                      {/* Phantom 3 Series */}
                      <optgroup label="Phantom 3 Series">
                        <option value="PHANTOM_3_PROFESSIONAL">PHANTOM 3 PROFESSIONAL</option>
                        <option value="PHANTOM_3_ADVANCED">PHANTOM 3 ADVANCED</option>
                        <option value="PHANTOM_3_STANDARD">PHANTOM 3 STANDARD</option>
                        <option value="PHANTOM_3_4K">PHANTOM 3 4K</option>
                      </optgroup>

                      {/* Industrial */}
                      <optgroup label="Industrial">
                        <option value="INSPIRE_2">INSPIRE 2</option>
                        <option value="INSPIRE_1_PRO">INSPIRE 1 PRO</option>
                        <option value="INSPIRE_1">INSPIRE 1</option>
                        <option value="M200_V2">M200 V2</option>
                        <option value="M210_RTK_V2">M210 RTK V2</option>
                        <option value="MATRICE_600_PRO">MATRICE 600 PRO</option>
                        <option value="MATRICE_600">MATRICE 600</option>
                        <option value="MATRICE_100">MATRICE 100</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {/* Battery Power Level Trigger */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Battery Power Level Trigger
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Safety threshold for battery-critical actions
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action on Low Battery
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={missionSettings.batteryAction || 'return_home'}
                        onChange={(e) => onMissionSettingChange('batteryAction', e.target.value)}
                      >
                        <option value="return_home">Return to Home</option>
                        <option value="land">Land</option>
                        <option value="stop_timeline">Stop Timeline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Battery Level Threshold (%)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={missionSettings.batteryThreshold || 20}
                        onChange={(e) =>
                          onMissionSettingChange('batteryThreshold', parseInt(e.target.value))
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="font-medium">
                          {missionSettings.batteryThreshold || 20}%
                        </span>
                        <span>100%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Recommended: 20-30%</p>
                    </div>
                  </div>
                </div>

                {/* RC Signal Lost Behavior */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    RC Signal Lost Behavior
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action on Signal Loss
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={missionSettings.signalLostAction || 'hover'}
                      onChange={(e) => onMissionSettingChange('signalLostAction', e.target.value)}
                    >
                      <option value="hover">Hover: Maintain position</option>
                      <option value="landing">Landing: Initiate automatic landing</option>
                      <option value="return_home">Return to Home: Return to home point</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <TimelineTab
                waypoints={waypoints}
                onSetRootView={setRootView}
                clearWaypoints={clearWaypoints}
                setActiveTab={setActiveTab}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  // Original waypoint panel view
  return (
    <div
      className={`absolute top-[50px] right-0 bottom-0 h-[calc(100%-50px)] md:block transition-all duration-300 ease-out ${
        isDesktopCollapsed ? 'translate-x-full' : 'translate-x-0'
      }`}
    >
      <button
        onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-white hover:bg-gray-50 rounded-l-lg shadow-lg p-2 transition-all duration-200 border border-r-0 border-gray-200"
      >
        <ChevronLeftIcon size={20} className="text-gray-600" />
      </button>

      <div className="w-[400px] h-full bg-white rounded-l-xl shadow-2xl border-l border-gray-200 flex flex-col">
        {/* Tab Navigation */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setRootView('root')
                  setActiveTab('timeline')
                }}
                className="p-1 hover:bg-white/50 rounded-full transition-colors duration-200"
              >
                <ChevronLeftIcon size={16} className="text-gray-500" />
              </button>
              <h2 className="text-lg font-semibold text-gray-800">Waypoint Panel</h2>
            </div>
            <button
              onClick={() => setIsDesktopCollapsed(true)}
              className="p-1 hover:bg-white/50 rounded-full transition-colors duration-200"
            >
              <XIcon size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Tab Buttons */}
          <div className="flex space-x-0.5">
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                activeTab === 'settings'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              <Settings size={14} />
              <span>Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('waypoints')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                activeTab === 'waypoints'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              <MapPinIcon size={14} />
              <span>Waypoints</span>
              {activeTab === 'waypoints' && (
                <span className="bg-white/20 text-white text-xs px-1 py-0.5 rounded-full">
                  {waypoints.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                activeTab === 'actions'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              <Play size={14} />
              <span>Actions</span>
            </button>

            <button
              onClick={() => setActiveTab('target')}
              className={`flex-1 flex items-center justify-center space-x-1 px-2 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                activeTab === 'target'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/70 text-gray-600 hover:bg-white hover:text-gray-800'
              }`}
            >
              <TargetIcon size={14} />
              <span>Targets</span>
            </button>
          </div>
        </div>

        {/* Validation Status */}
        {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div
              className={`rounded-lg p-3 ${
                validationResult.errors.length > 0
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {validationResult.errors.length > 0 ? (
                  <AlertTriangle size={16} className="text-red-500" />
                ) : (
                  <AlertTriangle size={16} className="text-yellow-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    validationResult.errors.length > 0 ? 'text-red-700' : 'text-yellow-700'
                  }`}
                >
                  Mission Validation
                </span>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-medium text-red-600 mb-1">
                    Errors ({validationResult.errors.length}):
                  </div>
                  <ul className="text-xs text-red-600 space-y-1">
                    {validationResult.errors.slice(0, 3).map((error, idx) => (
                      <li key={idx} className="flex items-start space-x-1">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                    {validationResult.errors.length > 3 && (
                      <li className="text-red-500 italic">
                        +{validationResult.errors.length - 3} more errors...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {validationResult.warnings.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-yellow-600 mb-1">
                    Warnings ({validationResult.warnings.length}):
                  </div>
                  <ul className="text-xs text-yellow-600 space-y-1">
                    {validationResult.warnings.slice(0, 2).map((warning, idx) => (
                      <li key={idx} className="flex items-start space-x-1">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                    {validationResult.warnings.length > 2 && (
                      <li className="text-yellow-500 italic">
                        +{validationResult.warnings.length - 2} more warnings...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Status */}
        {validationResult.isValid && validationResult.errors.length === 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">Mission Ready for Upload</span>
              </div>
              {validationResult.warnings.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-yellow-600 mb-1">
                    Warnings ({validationResult.warnings.length}):
                  </div>
                  <ul className="text-xs text-yellow-600 space-y-1">
                    {validationResult.warnings.slice(0, 2).map((warning, idx) => (
                      <li key={idx} className="flex items-start space-x-1">
                        <span>•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                    {validationResult.warnings.length > 2 && (
                      <li className="text-yellow-500 italic">
                        +{validationResult.warnings.length - 2} more warnings...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  )
}
