import fs from 'fs';
import path from 'path';
import * as THREE from 'three';

export function createEventTarget() {
  const noop = () => null;
  return {
    addEventListener: noop,
    removeEventListener: noop
  };
}

/**
 * Renders the scene to a off-screen FBO
 * and creates a PPM image from its content.
 */
export function renderPPM(game, width, height) {
  const texture = new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat
  });

  game.renderer.render(game.scene, game.camera, texture, true);
  const pixels = new Uint8Array(width * height * 4);
  const gl = game.renderer.getContext();
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let output = `P3\n${width} ${height}\n255\n`;
  for (let i = 0; i < pixels.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      output += pixels[i + j] + ' ';
    }
  }

  return output;
}

/**
 * Reads a .ppm fixture with the given name.
 */
export function readFixture(fixtureName) {
  const fileName = `${fixtureName}.ppm`;
  const fullPath = path.resolve(__dirname, 'fixtures', fileName);
  return fs.readFileSync(fullPath, { encoding: 'utf8' });
}
