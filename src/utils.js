// TODO: Remove me
export function resizeCanvas(canvas) {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

export function degreesToRadians(degrees) {
  return (Math.PI * degrees) / 180;
}
