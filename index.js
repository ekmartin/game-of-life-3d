import GameOfLife from './game-of-life';

const game = new GameOfLife(window.innerWidth, window.innerHeight);
game.setup();
game.animate();
