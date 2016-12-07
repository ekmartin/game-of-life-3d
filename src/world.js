import * as THREE from 'three';
import { calculateCameraDimensions } from './utils';

export default class World {
  constructor() {
    this.scene = new THREE.Scene();
    const near = -700;
    const far = 1000;
    const { left, right, top, bottom } = calculateCameraDimensions();
    this.camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    this.camera.position.y = 50;

    // Create the grid:
    const gridSize = 500;
    const gridStep = 10;
    const grid = new THREE.GridHelper(gridSize, gridStep, 0x888888);
    this.scene.add(grid);

    const size = 100;
    const geometry = new THREE.BoxGeometry(size, size, size);
    for (let x = 0; x < gridStep; x++) {
      for (let y = 0; y < gridStep; y++) {
        for (let z = 0; z < gridStep; z++) {
          const color = new THREE.Color(Math.random(), Math.random(), Math.random());
          const material = new THREE.MeshBasicMaterial({ color });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.y = (z * size) - 450;
          cube.position.x = (x * size) - 450;
          cube.position.z = (y * size) - 450;
          this.scene.add(cube);
        }
      }
    }

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  animate() {
    window.requestAnimationFrame(() => this.animate());
    this.render();
  }

  render() {
    const timer = Date.now() * 0.0001;
    this.camera.position.x = Math.cos(timer) * 200;
    this.camera.position.z = Math.sin(timer) * 200;
    this.camera.lookAt(this.scene.position);
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const dimensions = calculateCameraDimensions();
    Object.keys(dimensions).forEach(key => {
      this.camera[key] = dimensions[key];
    });

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
