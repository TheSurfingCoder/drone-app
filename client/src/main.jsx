import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './style.css' // or whatever CSS you're using
import 'cesium/Build/Cesium/Widgets/widgets.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
