import React from 'react'
import 'leaflet/dist/leaflet.css'
import MissionPlannerWrapper from './components/MissionPlannerWrapper.jsx'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { AuthProvider } from './contexts/AuthContext'

export default function App() {
  console.log('hello form app.jsx')
  return (
    <AuthProvider>
      <MissionPlannerWrapper />
    </AuthProvider>
  )
}
