import React from 'react'
import ModernStatusPill from './ModernStatusPill'
import ModernStatus3DPill from './ModernStatus3DPill'

export default function ModernStatusPillWrapper({
  viewMode,
  waypoints,
  unitSystem,
  googlePhotorealistic,
  setGooglePhotorealistic,
  currentDate,
  currentTime,
  currentTimezone,
  onDateTimeChange,
}) {
  if (viewMode === '2d') {
    return <ModernStatusPill waypoints={waypoints} unitSystem={unitSystem} />
  }

  return (
    <ModernStatus3DPill
      googlePhotorealistic={googlePhotorealistic}
      setGooglePhotorealistic={setGooglePhotorealistic}
      currentDate={currentDate}
      currentTime={currentTime}
      currentTimezone={currentTimezone}
      onDateTimeChange={onDateTimeChange}
      waypoints={waypoints}
      unitSystem={unitSystem}
    />
  )
}
