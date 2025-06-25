import React from 'react'
import 'leaflet/dist/leaflet.css'
import MissionPlannerWrapper from './components/MissionPlannerWrapper.jsx'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { AuthProvider } from './contexts/AuthContext'
import { TimelineProvider } from './contexts/TimelineContext'

export default function App() {
  return (
    <AuthProvider>
      <TimelineProvider>
        <MissionPlannerWrapper />
      </TimelineProvider>
    </AuthProvider>
  )
}
