import 'babel-polyfill';
import GameOfLife from './game-of-life';

const sustained = document.querySelector('#sustained');
const unbounded = document.querySelector('#unbounded');

const game = new GameOfLife(window.innerWidth, window.innerHeight);
game.setup();
game.animate();

const growthListener = (...args) => e => {
  e.preventDefault();
  if (!e.target.className.includes('active')) {
    const other = sustained === e.target ? unbounded : sustained;
    other.className = '';
    e.target.className = 'active';
  }

  game.setGameParameters(...args);
};

/**
 * 4526 doesn't really fulfill the properties
 * of Game of Life, since it keeps growing endlessly
 * (never stabilizes).
 * Better alternatives are 5766, 4555 and 6855.
 * However, all of these die pretty quickly,
 * so for demonstration purposes we allow the user
 * to select an unbounded option, like 4526.
 *
 * For more info see Carter Bays' paper:
 * http://www.complex-systems.com/pdf/01-3-1.pdf
 */
sustained.addEventListener('click', growthListener(5, 7, 6, 6));
unbounded.addEventListener('click', growthListener(4, 5, 2, 6));
