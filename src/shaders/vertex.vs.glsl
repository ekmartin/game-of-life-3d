attribute vec2 position;
uniform vec2 resolution;
uniform vec2 translation;

void main() {
  vec2 translatedPosition = position + translation;
  vec2 zeroToOne = translatedPosition / resolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clipSpace = zeroToTwo - 1.0;
  gl_Position = vec4(clipSpace, 0, 1);
}
