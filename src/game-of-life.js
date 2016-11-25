import createBuffer from 'gl-buffer';
import createShader from 'gl-shader';
import createTexture from 'gl-texture2d';
import createFramebuffer from 'gl-fbo';
import ndarray from 'ndarray';
import { resizeCanvas } from './utils';
import copyFragment from './shaders/copy.fs.glsl';
import updateFragment from './shaders/update.fs.glsl';
import drawVertex from './shaders/draw.vs.glsl';

const SCALE = 4;

export default class GameOfLife {
  constructor() {
    const canvas = document.querySelector('#canvas');
    const gl = this.gl = canvas.getContext('webgl');
    if (!gl) {
      throw new Error('No WebGL available');
    }

    gl.disable(gl.DEPTH_TEST);
    this.viewSize = [canvas.width, canvas.height];
    this.stateSize = this.viewSize.map(size => size / SCALE);

    this.programs = {
      copy: createShader(gl, drawVertex, copyFragment),
      update: createShader(gl, drawVertex, updateFragment)
    };

    this.textures = {
      front: this.createTexture(),
      back: this.createTexture()
    };

    const bufferData = [1, -1, 1, -1, -1, 1, 1, 1];
    this.buffer = createBuffer(gl, bufferData);
    this.framebuffer = createFramebuffer(gl, this.stateSize);
    // this.programs.copy.attributes.quad.location = 0;
    // this.programs.update.attributes.quad.location = 0;

    this.randomizeBoard();
  }

  createTexture() {
    const texture = createTexture(this.gl, this.stateSize);
    texture.wrap = this.gl.REPEAT;
    return texture;
  }

  setState(state) {
    const data = new Uint8Array(this.stateSize[0] * this.stateSize[1] * SCALE);
    state.forEach((value, index) => {
      const scaled = index * SCALE;
      for (let offset = 0; offset < 3; offset++) {
        data[scaled + offset] = value ? 255 : 0;
      }

      data[scaled + 3] = 255;
    });

    const ndData = ndarray(data, [...this.stateSize, 4]);
    this.textures.front.setPixels(ndData);
  }

  randomizeBoard() {
    const newState = new Uint8Array(this.stateSize[0] * this.stateSize[1])
      .map(() => Math.round(Math.random()));

    this.setState(newState);
  }

  swap() {
    const oldFront = this.textures.front;
    this.textures.front = this.textures.back;
    this.textures.back = oldFront;
  }

  step() {
    const { gl } = this;
    this.framebuffer.bind();
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D, this.textures.back.handle, 0);
    this.textures.front.bind();
    this.gl.viewport(0, 0, ...this.stateSize);

    const { update } = this.programs;
    update.bind();
    this.buffer.bind();
    update.attributes.quad.pointer();
    update.uniforms.state = 0;
    update.uniforms.scale = this.stateSize;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.swap();
  }

  draw() {
    const { gl } = this;
    resizeCanvas(gl.canvas);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.textures.front.bind();
    gl.viewport(0, 0, ...this.viewSize);

    const { copy } = this.programs;
    copy.bind();
    this.buffer.bind();
    copy.attributes.quad.pointer();
    copy.uniforms.state = 0;
    copy.uniforms.scale = this.viewSize;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  render() {
    this.step();
    this.draw();
    window.requestAnimationFrame(() => this.render());
  }
}
