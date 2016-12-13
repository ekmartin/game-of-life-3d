import test from 'ava';
import GL from 'gl';
import GameOfLife from '../game-of-life';
import { createEventTarget, renderPPM, readFixture } from './utils';

const width = 1000;
const height = 1000;
const createGame = gl => {
  const canvas = createEventTarget();
  const options = { context: gl, canvas };
  return new GameOfLife(width, height, options);
};


test('Initial step renders correctly', t => {
  const gl = GL(width, height);
  const game = createGame(gl);
  const state = game.createCube();
  game.setState(state);
  game.step();
  const ppm = renderPPM(game, width, height);
  const expected = readFixture('cube');
  t.is(ppm, expected);
});

test('readState returns the correct result', t => {
  const gl = GL(width, height);
  const game = createGame(gl);
  const initial = game.createCube();
  game.setState(initial);
  game.step();
  const count = game.readState().reduce((a, b) => a + b);
  // 4 cubes
  t.is(count, 24);
});
