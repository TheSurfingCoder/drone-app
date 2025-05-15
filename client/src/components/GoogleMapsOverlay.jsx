import { useCesium } from "resium";
import { createGooglePhotorealistic3DTileset } from "cesium";

const getGoogleMaps = async () => {
  try {
    const googleMaps3DTileset = await createGooglePhotorealistic3DTileset();
    return googleMaps3DTileset;
  } catch {
    console.error("failed to load tiles");
  }
};
const googleMaps3DTileset = await getGoogleMaps().then((response) => response);

const GoogleMapsOverlay = () => {
  const { viewer } = useCesium();
  viewer.scene.primitives.add(googleMaps3DTileset);
};

export default GoogleMapsOverlay;