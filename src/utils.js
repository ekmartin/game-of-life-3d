export function calculateCameraDimensions() {
  const width = window.innerWidth / 2;
  const height = window.innerHeight / 2;
  return {
    left: -width,
    right: width,
    top: height,
    bottom: -height
  };
}
