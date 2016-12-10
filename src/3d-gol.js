import * as THREE from 'three';
import updateFragment from './three-shaders/update.fs.glsl';
import updateVertex from './three-shaders/update.vs.glsl';

export default class GameOfLife {
  constructor() {
    this.scene = new THREE.Scene();
    this.offScene = new THREE.Scene();

    const near = -700;
    const far = 1000;
    this.camera = new THREE.OrthographicCamera(
      -window.innerWidth / 2, window.innerWidth / 2,
      window.innerHeight / 2, -window.innerHeight / 2,
      near, far
    );
    this.camera.position.y = 50;

    this.width = 128;
    this.height = 128;
    this.offCamera = new THREE.OrthographicCamera(
      -this.width / 2, this.width / 2,
      this.height / 2, -this.height / 2,
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
      uniforms: {
        state: {
          type: 't',
          value: this.textures.front.texture
        },
        stateSize: {
          type: 'v2',
          value: new THREE.Vector2(this.width, this.height)
        }
      }
    });

    this.drawMaterial = new THREE.MeshBasicMaterial({ map: this.textures.front.texture });

    const quad = new THREE.PlaneBufferGeometry(this.width, this.height);
    const gameMesh = new THREE.Mesh(quad, this.gameMaterial);
    this.offScene.add(gameMesh);

    const renderMesh = new THREE.Mesh(quad, this.drawMaterial);
    renderMesh.position.z = 100;
    this.scene.add(renderMesh);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.randomizeBoard();
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

  randomizeBoard() {
    const newState = new Uint8Array(this.width * this.height)
      .map(() => Math.round(Math.random()));

    this.setState(newState);
  }


  swapTextures() {
    const { textures } = this;
    [textures.front, textures.back] = [textures.back, textures.front];
  }

  step() {
    // Ping-pong between the two textures, read from the front - draw to the back:
    this.gameMaterial.uniforms.state.value = this.textures.front.texture;
    this.renderer.render(this.offScene, this.offCamera, this.textures.back, true);
    // Then swap them so we can do the opposite
    // the next time (so our simulation moves forward):
    this.swapTextures();
  }

  render() {
    // We're swapping the textures in step(), so we always
    // read from the front texture in render
    this.drawMaterial.map = this.textures.front.texture;
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    window.requestAnimationFrame(() => this.animate());
    this.step();
    this.render();
  }
}
