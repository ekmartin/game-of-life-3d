precision mediump float;

uniform sampler2D state;
uniform vec2 stateSize;
uniform vec3 gridPosition;

void main() {
  vec2 coord = gridPosition.xy;
  coord.x += gridPosition.z * stateSize.y;
  vec4 texel = texture2D(state, coord / stateSize);
  if (int(texel.r) == 1) {
    gl_FragColor = vec4(0, 1, 0, 1);
  } else {
    gl_FragColor = vec4(0.2, 0.2, 0.2, 1);
  }
}
