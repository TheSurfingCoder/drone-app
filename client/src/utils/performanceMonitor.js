/**
 * Performance monitoring utility for Cesium viewer
 * Helps track tile loading performance and provide user feedback
 */

export class CesiumPerformanceMonitor {
  constructor(viewer) {
    this.viewer = viewer
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fpsHistory = []
    this.tileLoadHistory = []
    this.isMonitoring = false
  }

  startMonitoring() {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.monitorFrameRate()
    this.monitorTileLoading()
  }

  stopMonitoring() {
    this.isMonitoring = false
  }

  monitorFrameRate() {
    if (!this.isMonitoring) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (deltaTime >= 1000) {
      // Update every second
      const fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.fpsHistory.push(fps)

      // Keep only last 10 FPS readings
      if (this.fpsHistory.length > 10) {
        this.fpsHistory.shift()
      }

      const avgFps = Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length)

      // Log performance warnings
      if (avgFps < 30) {
        console.warn(`⚠️ Low FPS detected: ${avgFps} FPS. Consider reducing detail level.`)
      }

      this.frameCount = 0
      this.lastTime = currentTime
    }

    this.frameCount++

    if (this.isMonitoring) {
      requestAnimationFrame(() => this.monitorFrameRate())
    }
  }

  monitorTileLoading() {
    if (!this.isMonitoring || !this.viewer) return

    // Monitor tile loading performance
    const scene = this.viewer.scene
    const globe = scene.globe

    if (globe) {
      const tilesLoading = globe._surface._debug.tilesWaitingForChildren || 0
      const tilesRendered = globe._surface._debug.tilesRendered || 0

      if (tilesLoading > 10) {
        console.warn(`⚠️ High tile loading: ${tilesLoading} tiles waiting`)
      }

      this.tileLoadHistory.push({ tilesLoading, tilesRendered, timestamp: Date.now() })

      // Keep only last 20 readings
      if (this.tileLoadHistory.length > 20) {
        this.tileLoadHistory.shift()
      }
    }

    // Check again in 2 seconds
    setTimeout(() => this.monitorTileLoading(), 2000)
  }

  getPerformanceStats() {
    const avgFps =
      this.fpsHistory.length > 0
        ? Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length)
        : 0

    const recentTileLoads = this.tileLoadHistory.slice(-5)
    const avgTilesLoading =
      recentTileLoads.length > 0
        ? Math.round(
            recentTileLoads.reduce((sum, reading) => sum + reading.tilesLoading, 0) /
              recentTileLoads.length,
          )
        : 0

    return {
      averageFps: avgFps,
      averageTilesLoading: avgTilesLoading,
      performanceStatus: this.getPerformanceStatus(avgFps, avgTilesLoading),
    }
  }

  getPerformanceStatus(fps, tilesLoading) {
    if (fps < 30 || tilesLoading > 15) {
      return 'poor'
    }
    if (fps < 45 || tilesLoading > 8) {
      return 'moderate'
    }
    return 'good'
  }

  suggestOptimizations() {
    const stats = this.getPerformanceStats()
    const suggestions = []

    if (stats.averageFps < 30) {
      suggestions.push('Consider reducing maximumScreenSpaceError to 8 or higher')
      suggestions.push('Disable shadows and lighting for better performance')
      suggestions.push('Reduce camera movement speed')
    }

    if (stats.averageTilesLoading > 10) {
      suggestions.push('Consider preloading terrain data for mission areas')
      suggestions.push('Reduce tile cache size if memory is limited')
      suggestions.push('Switch to lower detail imagery provider')
    }

    return suggestions
  }
}

/**
 * Utility function to create a performance monitor for a Cesium viewer
 */
export function createPerformanceMonitor(viewer) {
  return new CesiumPerformanceMonitor(viewer)
}

/**
 * Utility function to optimize viewer settings based on performance
 */
export function applyPerformanceOptimizations(viewer, performanceLevel = 'balanced') {
  if (!viewer) return

  const optimizations = {
    high: {
      maximumScreenSpaceError: 2,
      tileCacheSize: 2000,
      enableLighting: true,
      enableShadows: true,
      enableFog: true,
    },
    balanced: {
      maximumScreenSpaceError: 4,
      tileCacheSize: 1000,
      enableLighting: false,
      enableShadows: true,
      enableFog: false,
    },
    low: {
      maximumScreenSpaceError: 8,
      tileCacheSize: 500,
      enableLighting: false,
      enableShadows: false,
      enableFog: false,
    },
  }

  const config = optimizations[performanceLevel]

  viewer.scene.globe.maximumScreenSpaceError = config.maximumScreenSpaceError
  viewer.scene.globe.tileCacheSize = config.tileCacheSize
  viewer.scene.globe.enableLighting = config.enableLighting
  viewer.shadows = config.enableShadows
  viewer.scene.fog.enabled = config.enableFog
}
