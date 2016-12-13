uniform sampler2D state;
uniform vec2 stateSize;
uniform float blue;

/**
 * Returns the enabled state of the coordinate
 * at the given direction (x + dx, y + dy, z + dz).
 */
int getPointState(int dx, int dy, int dz) {
  vec2 point = gl_FragCoord.xy + vec2(dx, dy);
  // If we have any z-changes, move to the correct slice:
  point.x += float(dz) * stateSize.y;
  point /= stateSize;
  vec4 texel = texture2D(state, point);
  return int(texel.r);
}

/**
 * Returns the enabled state of this fragment's position.
 */
int getCurrentPointState() {
  vec4 texel = texture2D(state, gl_FragCoord.xy / stateSize);
  return int(texel.r);
}

/**
 * Makes sure that we don't move outside
 * the texture. If WebGL supported it
 */
bool isValidY(int dy) {
  float newY = gl_FragCoord.y + float(dy);
  return newY > 0.0 && newY < stateSize.y;
}

/**
 * Makes sure that the change in x
 * doesn't put us in a new 3D plane.
 *
 * Example:
 * If we have a 2x2x2 cube, like below,
 * where x is our current point and
 * our dx is -1, that would actually
 * result in a movie in the z-direction,
 * which we don't want:
 *  ---   ---
 * |o o| |x o|
 * |o o| |o o|
 *  ---   ---
 */
bool isValidX(int dx) {
  float newX = gl_FragCoord.x + float(dx);
  int currentSlice = int(gl_FragCoord.x / stateSize.y);
  int nextSlice = int(newX / stateSize.y);
  return currentSlice == nextSlice;
}

void main() {
  int sum = 0;
  for (int dx = -1; dx <= 1; dx++) {
    for (int dy = -1; dy <= 1; dy++) {
      for (int dz = -1; dz <= 1; dz++) {
        bool notSelf = dx == 0 || dy == 0 || dz == 0;
        if (notSelf && isValidX(dx) && isValidY(dy)) {
          sum += getPointState(dx, dy, dz);
        }
      }
    }
  }

  int color;
  if (getCurrentPointState() == 1) {
    color = int(sum >= MIN_LIVE && sum <= MAX_LIVE);
  } else {
    color = int(sum >= MIN_BIRTH && sum <= MAX_BIRTH);
  }

  gl_FragColor = vec4(color, color, color, 1);
}
