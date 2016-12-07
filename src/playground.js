import gameShell from 'game-shell';
import twgl, { m4 } from 'twgl.js';
import fragmentShader from './shaders/playground.fs.glsl';
import vertexShader from './shaders/playground.vs.glsl';
import { cubePositions, cubeColors } from './cube';
import { degreesToRadians } from './utils';

export default class Playground {
  constructor() {
    const shell = this.shell = gameShell();

    // Alias keys to virtual names:
    shell.bind('move-left', 'left', 'A');
    shell.bind('move-right', 'right', 'D');
    shell.bind('move-up', 'up', 'W');
    shell.bind('move-down', 'down', 'S');

    // Don't block hotkeys:
    shell.preventDefaults = false;
    shell.on('init', this.initialize.bind(this));
  }

  initialize() {
    console.log('eh', this.shell.keyNames, this.shell);
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
      a_position: cubePositions,
      a_color: { data: cubeColors, numComponents: 3 }
    });
  }

  draw() {
    const { gl, bufferInfo, programInfo } = this;
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.CULL_FACE);

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

  tick() {
    const { shell } = this;
    if (shell.wasDown('move-left')) {
      this.translation[0] -= 10;
    }

    if (shell.wasDown('move-right')) {
      this.translation[0] += 10;
    }

    if (shell.wasDown('move-up')) {
      this.translation[1] += 10;
    }

    if (shell.wasDown('move-down')) {
      this.translation[1] -= 10;
    }

    if (shell.wasDown('r')) {
      this.rotation = this.rotation.map(rad => rad + 0.1);
    }

    if (shell.wasDown('R')) {
      this.rotation = this.rotation.map(rad => rad - 0.1);
    }

    if (shell.wasDown('+')) {
      this.scale = this.scale.map(scale => scale + 0.1);
    }

    if (shell.wasDown('-')) {
      this.scale = this.scale.map(scale => scale - 0.1);
    }
  }

  start() {
    this.shell.on('tick', this.tick.bind(this));
    this.shell.on('render', this.draw.bind(this));
  }
}
