import * as THREE from 'three';
import orbitSetup from 'three-orbit-controls';
import updateFragment from './three-shaders/update.fs.glsl';
import updateVertex from './three-shaders/update.vs.glsl';
import drawFragment from './three-shaders/draw.fs.glsl';
import drawVertex from './three-shaders/draw.vs.glsl';

const TICK = 700;

export default class GameOfLife {
  constructor() {
    this.scene = new THREE.Scene();
    this.offScene = new THREE.Scene();
    this.lastTick = 0;

    const fov = 60;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 1;
    const far = 10000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.x = -300;
    this.camera.position.y = 500;
    this.camera.position.z = 1500;

    const OrbitControls = orbitSetup(THREE);
    this.controls = new OrbitControls(this.camera);

    const gameSize = 10;
    const boxSize = 50;
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

    this.textures = {
      front: this.createRenderTarget(),
      back: this.createRenderTarget()
    };

    this.gameMaterial = new THREE.ShaderMaterial({
      fragmentShader: updateFragment,
      vertexShader: updateVertex,
      defines: {
        MIN_LIVE: 4,
        MAX_LIVE: 5,
        MIN_BIRTH: 2,
        MAX_BIRTH: 6
      },
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

    const gridHelper = new THREE.GridHelper(gridSize, gameSize);
    this.scene.add(gridHelper);
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    // Add some padding between each cube:
    const padding = 0;
    const spotSize = padding + boxSize;
    const totalSize = spotSize * gameSize;
    // Offset is used to center the whole block:
    const offset = (totalSize - boxSize) / 2;
    this.cubes = [];
    for (let x = 0; x < gameSize; x++) {
      for (let y = 0; y < gameSize; y++) {
        for (let z = 0; z < gameSize; z++) {
          const drawMaterial = this.createMaterial(x, y, z);
          const cube = new THREE.Mesh(geometry, drawMaterial);
          cube.position.x = (x * spotSize) - offset;
          cube.position.y = (y * spotSize) - offset;
          cube.position.z = (z * spotSize) - offset;
          this.scene.add(cube);
          this.cubes.push(cube);
        }
      }
    }

    const quad = new THREE.PlaneBufferGeometry(this.width, this.height);
    const gameMesh = new THREE.Mesh(quad, this.gameMaterial);
    this.offScene.add(gameMesh);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.drawMaterial = new THREE.MeshBasicMaterial({ map: this.textures.front.texture });
    const test = new THREE.Mesh(quad, this.drawMaterial);
    test.position.x = -450;
    test.position.y = 150;
    test.position.z = 300;
    this.scene.add(test);

    this.randomizeBoard();
    this.camera.lookAt(this.scene.position);
    this.isRunning = true;

    window.addEventListener('resize', () => this.onWindowResize());
    document.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        this.isRunning = !this.isRunning;
      }
    });
  }

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

  createRenderTarget() {
    return new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter
    });
  }

  /**
   * Set the board's state by translating from a
   * regular Uint8Array of off/on (0/1) to
   * rgba.
   */
  setState(state) {
    const data = new Uint8Array(this.width * this.height * 4);
    state.forEach((value, index) => {
      const rgbaIndex = index * 4;
      // If value is "on", set all rgb to on as well:
      const rgbValue = value ? 255 : 0;
      for (let offset = 0; offset < 3; offset++) {
        data[rgbaIndex + offset] = rgbValue;
      }

      data[rgbaIndex + 3] = 255;
    });

    this.textures.front.texture = new THREE.DataTexture(
      data,
      this.width,
      this.height,
      THREE.RGBAFormat
    );
    this.textures.front.texture.needsUpdate = true;
  }

  /**
   * Randomizes the game state, saving the result to
   * the front texture.
   */
  randomizeBoard() {
    const newState = new Uint8Array(this.width * this.height)
      .map(() => {
        const isOn = Math.random() > 0.8;
        return Number(isOn);
      });

    this.setState(newState);
  }

  /**
   * Swaps the front and back textures.
   */
  swapTextures() {
    const { textures } = this;
    [textures.front, textures.back] = [textures.back, textures.front];
  }

  /**
   * Performs one simulation step, swapping the textures at the end.
   */
  step() {
    // Ping-pong between the two textures, read from the front - draw to the back:
    this.gameMaterial.uniforms.state.value = this.textures.front.texture;
    this.renderer.render(this.offScene, this.offCamera, this.textures.back, true);

    // To make sure we render the initial state,
    // we always read from the front texture here:
    this.cubes.forEach(({ material }) => {
      material.uniforms.state.value = this.textures.front.texture;
    });
    this.drawMaterial.map = this.textures.front.texture;

    // Then swap them so we can do the opposite
    // the next time (so our simulation moves forward):
    this.swapTextures();
  }

  animate() {
    window.requestAnimationFrame(() => this.animate());
    if (this.isRunning && (Date.now() - this.lastTick) > TICK) {
      this.step();
      this.lastTick = Date.now();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}
