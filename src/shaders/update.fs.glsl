precision mediump float;

uniform sampler2D state;
uniform vec2 scale;

int getPointState(int dx, int dy) {
  vec2 point = (gl_FragCoord.xy + vec2(dx, dy)) / scale;
  vec4 texel = texture2D(state, point);
  return int(texel.r);
}

void main() {
  int sum = 0;
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      if (dx != 0 || dy != 0) {
        sum += getPointState(dx, dy);
      }
    }
  }

  if (sum == 3) {
    gl_FragColor = vec4(1, 1, 1, 1);
  } else if (sum == 2) {
    int currentColor = getPointState(0, 0);
    // Only set the color if it's already on:
    gl_FragColor = vec4(currentColor, currentColor, currentColor, 1);
  } else {
    gl_FragColor = vec4(0, 0, 0, 1);
  }
}
