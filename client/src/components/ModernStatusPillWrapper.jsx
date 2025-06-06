import React from 'react'
import ModernStatusPill from './ModernStatusPill'
import ModernStatus3DPill from './ModernStatus3DPill'

export default function ModernStatusPillWrapper({
  viewMode,
  waypoints,
  unitSystem,
  segmentSpeeds,
  googlePhotorealistic,
  setGooglePhotorealistic,
  currentTimeUTC,
  onDateTimeChange,
}) {
  if (viewMode === '2d') {
    return (
      <ModernStatusPill
        waypoints={waypoints}
        unitSystem={unitSystem}
        segmentSpeeds={segmentSpeeds}
      />
    )
  }

  return (
    <ModernStatus3DPill
      googlePhotorealistic={googlePhotorealistic}
      setGooglePhotorealistic={setGooglePhotorealistic}
      currentTimeUTC={currentTimeUTC}
      onDateTimeChange={onDateTimeChange}
      waypoints={waypoints}
      segmentSpeeds={segmentSpeeds}
      unitSystem={unitSystem}
      
    />
  )
}
