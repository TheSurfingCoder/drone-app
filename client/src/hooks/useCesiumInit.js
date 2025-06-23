import { useEffect, useState } from 'react'
import { CesiumTerrainProvider, Ion, Math as CesiumMath, Cartesian3 } from '@cesium/engine'

Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN

export default function useCesiumInit(viewerRef) {
  const [terrainProvider, setTerrainProvider] = useState(null)
  const [viewer, setViewer] = useState(null)

  useEffect(() => {
    const loadTerrain = async () => {
      try {
        const terrain = await CesiumTerrainProvider.fromIonAssetId(1)
        await terrain.readyPromise
        setTerrainProvider(terrain)
      } catch (err) {
        console.error('❌ Terrain failed:', err)
      }
    }
    loadTerrain()
  }, [])

  useEffect(() => {
    const tryAttachViewer = () => {
      if (!viewer && viewerRef.current?.cesiumElement) {
        setViewer(viewerRef.current.cesiumElement)
      }
    }

    const interval = setInterval(tryAttachViewer, 200)
    return () => clearInterval(interval)
  }, [viewerRef, viewer])

  useEffect(() => {
    if (!viewer || !terrainProvider) return

    viewer.scene.camera.setView({
      destination: Cartesian3.fromDegrees(
        -122.44547431638014,
        37.611176246617994,
        17363.451336429982,
      ),
      orientation: {
        heading: CesiumMath.toRadians(0.0),
        pitch: CesiumMath.toRadians(-45.0),
        roll: 0.0,
      },
    })
  }, [viewer, terrainProvider])

  return { viewer, terrainProvider }
}
