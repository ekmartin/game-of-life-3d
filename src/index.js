import createBuffer from 'gl-buffer';
import createShader from 'gl-shader';
import { resizeCanvas } from './utils';
import vertexSource from './shaders/vertex.vs.glsl';
import fragmentSource from './shaders/fragment.fs.glsl';

const translation = [0, 0];

const color = [Math.random(), Math.random(), Math.random()];
const drawScene = (gl, shader) => {
  resizeCanvas(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  shader.attributes.position.pointer();
  shader.uniforms.translation = translation;
  shader.uniforms.resolution = [gl.canvas.width, gl.canvas.height];
  shader.uniforms.color = [...color, 1];

  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const main = () => {
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    throw new Error('No WebGL available');
  }

  const shader = createShader(gl, vertexSource, fragmentSource);
  shader.bind();
  const positions = [
    10, 20,
    80, 20,
    10, 30,
    10, 30,
    80, 20,
    80, 30
  ];

  createBuffer(gl, positions, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
  drawScene(gl, shader);
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        translation[0] -= 10;
        break;
      case 'ArrowRight':
        translation[0] += 10;
        break;
      case 'ArrowDown':
        translation[1] -= 10;
        break;
      case 'ArrowUp':
        translation[1] += 10;
        break;
    }

    drawScene(gl, shader);
  });
};

main();
