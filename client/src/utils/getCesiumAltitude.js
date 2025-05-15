// utils/getCesiumAltitude.js
import {
    Cartographic,
    sampleTerrainMostDetailed,
    Math as CesiumMath,
  } from '@cesium/engine';
  
  /**
   * Samples the Cesium terrain for a given lat/lng.
   * @param {Object} terrainProvider - The Cesium terrain provider
   * @param {Number} lat - Latitude
   * @param {Number} lng - Longitude
   * @returns {Promise<Number>} Altitude in meters
   */
  export async function getCesiumAltitude(terrainProvider, lat, lng) {
    const carto = Cartographic.fromDegrees(lng, lat);
    const [sampled] = await sampleTerrainMostDetailed(terrainProvider, [carto]);
    return sampled.height;
  }
  