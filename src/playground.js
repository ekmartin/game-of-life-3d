import twgl, { m4 } from 'twgl.js';
import fragmentShader from './shaders/playground.fs.glsl';
import vertexShader from './shaders/playground.vs.glsl';
import { positionF, colorF } from './big-f';
import { degreesToRadians } from './utils';

export default class Playground {
  constructor() {
    const canvas = document.querySelector('#canvas');
    const gl = this.gl = canvas.getContext('webgl');
    if (!gl) {
      throw new Error('No WebGL available');
    }

    this.translation = [-150, 0, -200];
    this.scale = [1, 1, 1];
    this.rotation = [0.7, 0.5, 5.8];
    this.programInfo = twgl.createProgramInfo(gl, [vertexShader, fragmentShader]);
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, {
      a_position: positionF,
      a_color: { data: colorF, normalized: true, numComponents: 3 }
    });
  }

  draw() {
    const { gl, bufferInfo, programInfo } = this;
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);

    // const z = 400;
    // const matrix = m4.ortho(0, gl.canvas.clientWidth, gl.canvas.clientHeight, 0, -z, z);
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const fov = degreesToRadians(70);
    const matrix = m4.perspective(fov, aspect, 1, 2000);
    m4.translate(matrix, this.translation, matrix);
    m4.scale(matrix, this.scale, matrix);
    m4.rotateX(matrix, this.rotation[0], matrix);
    m4.rotateY(matrix, this.rotation[1], matrix);
    m4.rotateZ(matrix, this.rotation[2], matrix);

    const uniforms = {
      u_matrix: matrix
    };

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
    twgl.setUniforms(programInfo, uniforms);

    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }

  render() {
    document.addEventListener('keydown', e => {
      switch (e.key) {
        case '+':
          this.scale = this.scale.map(scale => scale + 0.1);
          break;
        case '-':
          this.scale = this.scale.map(scale => scale - 0.1);
          break;
        case 'r':
          this.rotation = this.rotation.map(rad => rad + 0.1);
          break;
        case 'R':
          this.rotation = this.rotation.map(rad => rad - 0.1);
          break;
        case 'ArrowLeft':
          this.translation[0] -= 10;
          break;
        case 'ArrowRight':
          this.translation[0] += 10;
          break;
        case 'ArrowDown':
          this.translation[1] += 10;
          break;
        case 'ArrowUp':
          this.translation[1] -= 10;
          break;
      }

      window.requestAnimationFrame(() => this.draw());
    });

    window.requestAnimationFrame(() => this.draw());
  }
}
