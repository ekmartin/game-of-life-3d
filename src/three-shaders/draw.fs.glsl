precision mediump float;

uniform sampler2D state;
uniform vec2 stateSize;
uniform vec3 gridPosition;
uniform vec3 color;

void main() {
  vec2 coord = gridPosition.xy;
  coord.x += gridPosition.z * stateSize.y;
  vec4 texel = texture2D(state, coord / stateSize);
  if (int(texel.r) == 1) {
    gl_FragColor = vec4(color, 1);
  } else {
    discard;
  }
}
