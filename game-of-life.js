import * as THREE from 'three';
import orbitSetup from 'three-orbit-controls';
import updateFragment from './shaders/update.fs.glsl';
import updateVertex from './shaders/update.vs.glsl';
import drawFragment from './shaders/draw.fs.glsl';
import drawVertex from './shaders/draw.vs.glsl';

export default class GameOfLife {
  constructor(winWidth, winHeight, renderOptions) {
    this.winWidth = winWidth;
    this.winHeight = winHeight;
    this.scene = new THREE.Scene();
    this.offScene = new THREE.Scene();

    // Milliseconds between each game tick:
    this.tick = 400;
    this.lastTick = 0;

    const fov = 60;
    const aspect = winWidth / winHeight;
    const near = 1;
    const far = 5000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.x = -300;
    this.camera.position.y = 500;
    this.camera.position.z = 1500;

    const OrbitControls = orbitSetup(THREE);
    this.controls = new OrbitControls(this.camera);
    this.controls.minDistance = 400;
    this.controls.maxDistance = 4000;

    const gameSize = 20;
    const boxSize = 40;
    const gridSize = gameSize * boxSize;
    this.height = gameSize;
    this.width = gameSize * gameSize;
    this.stateSize = new THREE.Vector2(this.width, this.height);
    this.offCamera = new THREE.OrthographicCamera(
      -this.width / 2,
      this.width / 2,
      this.height / 2,
      -this.height / 2,
      -10000, 10000
    );
    this.offCamera.position.z = 100;

    this.textures = this.createTextures();
    const defines = {
      MIN_LIVE: 5,
      MAX_LIVE: 7,
      MIN_BIRTH: 6,
      MAX_BIRTH: 6
    };

    this.gameMaterial = new THREE.ShaderMaterial({
      fragmentShader: updateFragment,
      vertexShader: updateVertex,
      defines,
      uniforms: {
        state: {
          type: 't',
          value: this.textures.front.texture
        },
        stateSize: {
          type: 'v2',
          value: this.stateSize
        }
      }
    });

    // Create a grid of cubes, gameSize * gameSize:
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    // Offset is used to center the whole block:
    const offset = (gridSize - boxSize) / 2;
    this.cubes = [];
    for (let x = 0; x < gameSize; x++) {
      for (let y = 0; y < gameSize; y++) {
        for (let z = 0; z < gameSize; z++) {
          const drawMaterial = this.createMaterial(x, y, z);
          const cube = new THREE.Mesh(geometry, drawMaterial);
          cube.position.x = (x * boxSize) - offset;
          cube.position.y = (y * boxSize) - offset;
          cube.position.z = (z * boxSize) - offset;
          this.scene.add(cube);
          this.cubes.push(cube);
        }
      }
    }

    // Create the quad we'll render the texture to off-screen:
    const quad = new THREE.PlaneBufferGeometry(this.width, this.height);
    const gameMesh = new THREE.Mesh(quad, this.gameMaterial);
    this.offScene.add(gameMesh);

    this.renderer = new THREE.WebGLRenderer(Object.assign({
      antialias: true
    }, renderOptions));

    const state = this.randomizeBoard();
    this.setState(state);

    this.camera.lookAt(this.scene.position);
    this.isRunning = true;
  }

  /**
   * Attaches listeners and adds the canvas to the DOM.
   */
  setup() {
    this.renderer.setSize(this.winWidth, this.winHeight);
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize());
    document.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        this.isRunning = !this.isRunning;
      } else if (e.key === 's') {
        this.step();
      }
    });
  }

  /**
   * Updates the Game of Life parameters.
   */
  setGameParameters(minLive, maxLive, minBirth, maxBirth) {
    this.gameMaterial.defines = {
      MIN_LIVE: minLive,
      MAX_LIVE: maxLive,
      MIN_BIRTH: minBirth,
      MAX_BIRTH: maxBirth
    };

    this.gameMaterial.needsUpdate = true;
    // We could keep going here, but it
    // makes more sense to restart.
    const state = this.randomizeBoard();
    this.textures = this.createTextures();
    this.setState(state);
  }

  /**
   * Creates a 2x2 cube at the center,
   * an alternative to randomizeBoard().
   */
  createCube() {
    const newState = new Uint8Array(this.width * this.height);
    const center = this.height / 2;
    const isCenter = n => [center, center - 1].includes(n);
    // Assume we have an even grid, and put a 2x2x2 cube in the middle.
    for (let x = 0; x < this.height; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.height; z++) {
          if (isCenter(x) && isCenter(y) && isCenter(z)) {
            const index = x + (this.width * y) + (this.height * z);
            newState[index] = 1;
          }
        }
      }
    }

    return newState;
  }

  /**
   * Instantiates a ShaderMaterial with the correct uniforms,
   * based on the given cube position.
   */
  createMaterial(x, y, z) {
    const color = new THREE.Vector3(x / this.height, y / this.height, z / this.height);
    const uniforms = {
      state: {
        type: 't',
        value: this.textures.front.texture
      },
      stateSize: {
        type: 'v2',
        value: this.stateSize
      },
      gridPosition: {
        type: 'v3',
        value: new THREE.Vector3(x, y, z)
      },
      color: {
        type: 'v3',
        value: color
      }
    };

    return new THREE.ShaderMaterial({
      fragmentShader: drawFragment,
      vertexShader: drawVertex,
      uniforms
    });
  }

  /**
   * Creates two textures, front and back,
   * which we later ping-pong between
   * to simulate life.
   */
  createTextures() {
    const texture = () => new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter
    });

    return {
      front: texture(),
      back: texture()
    };
  }

  /**
   * Set the board's state by translating from a
   * regular Uint8Array of off/on (0/1) to
   * rgba.
   */
  setState(state) {
    const data = new Uint8Array(this.width * this.height * 4);
    for (let i = 0; i < state.length; i++) {
      const value = state[i];
      const rgbaIndex = i * 4;
      // If value is "on", set all rgb to on as well:
      const rgbValue = value ? 255 : 0;
      for (let offset = 0; offset < 3; offset++) {
        data[rgbaIndex + offset] = rgbValue;
      }

      data[rgbaIndex + 3] = 255;
    }

    this.textures.front.texture = new THREE.DataTexture(
      data,
      this.width,
      this.height,
      THREE.RGBAFormat
    );

    this.textures.front.texture.needsUpdate = true;
    this.bindRenderTexture();
  }

  /**
   * Returns the x, y, z coordinate of
   * a given index in the game texture.
   */
  getCoordinates(index) {
    const x = index % this.height;
    const y = Math.floor(index / this.width);
    const z = Math.floor((index % this.width) / this.height);
    return { x, y, z };
  }

  /**
   * Randomizes the game state,
   * returning a bit array that can be passed to setState().
   */
  randomizeBoard() {
    const limit = 0.65;
    return new Uint8Array(this.width * this.height)
      .map(() => Number(Math.random() > limit));
  }

  /**
   * Swaps the front and back textures.
   */
  swapTextures() {
    const { textures } = this;
    [textures.front, textures.back] = [textures.back, textures.front];
  }

  /**
   * Pass the front texture to the rendered game cubes.
   */
  bindRenderTexture() {
    this.cubes.forEach(({ material }) => {
      material.uniforms.state.value = this.textures.front.texture;
    });
  }

  /**
   * Performs one simulation step, swapping the textures at the end.
   */
  step() {
    // Ping-pong between the two textures, read from the front - draw to the back:
    this.gameMaterial.uniforms.state.value = this.textures.front.texture;
    this.renderer.render(this.offScene, this.offCamera, this.textures.back, true);
    // Then swap them so we can do the opposite
    // the next time (so our simulation moves forward):
    this.swapTextures();
    this.bindRenderTexture();
  }

  animate() {
    window.requestAnimationFrame(() => this.animate());
    if (this.isRunning && (Date.now() - this.lastTick) > this.tick) {
      this.step();
      this.lastTick = Date.now();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Returns a bit representation of the state texture,
   * on the same format that can be passed to setState().
   */
  readState() {
    const buffer = new Uint8Array(this.width * this.height * 4);
    this.renderer.readRenderTargetPixels(
      // If we call this after a step(),
      // the textuers have been swapped.
      // To be able to read the initial state
      // as well we read from the back here:
      this.textures.front,
      0, 0,
      this.width, this.height,
      buffer
    );

    // The texture contains 4 values for each cell,
    // we only care about the red (the first):
    return new Uint8Array(this.width * this.height)
      .map((_value, index) => Number(!!buffer[index * 4]));
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
