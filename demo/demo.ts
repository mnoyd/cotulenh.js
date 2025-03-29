import { CoTuLenh, RED, BLUE, COMMANDER, INFANTRY, TANK, ARTILLERY, NAVY } from '../dist/esm/cotulenh.js';

// Initialize game with default position
const game = new CoTuLenh();

// Helper to print the board with colors and heroic status
function printBoard(board: ReturnType<CoTuLenh['board']>) {
  console.log('\nCurrent Board:');
  for (let rank = 0; rank < 12; rank++) {
    let line = `${12 - rank}`.padStart(2, ' ') + ' ';
    for (let file = 0; file < 11; file++) {
      const piece = board[rank][file];
      if (!piece) {
        line += '· ';
      } else {
        let symbol = piece.type.toUpperCase();
        if (piece.heroic) symbol = '*' + symbol;
        line += piece.color === RED ? `\x1b[31m${symbol}\x1b[0m ` : `\x1b[34m${symbol}\x1b[0m `;
      }
    }
    console.log(line);
  }
  console.log('   a b c d e f g h i j k');
}

// Demo sequence
function runDemo() {
  // Initial state
  printBoard(game.board());
  console.log('Starting FEN:', game.fen());
  console.log('Turn:', game.turn());

  // // Make a move using SAN
  // const move1 = game.move('Cf1-f3');
  // if (move1) {
  //   console.log('\nMade move:', move1.san);
  //   printBoard(game.board());
  // }

  // Make another move using move object
  const move2 = game.move({ from: 'c5', to: 'c6' });
  if (move2) {
    console.log('\nMade move:', move2.san);
    printBoard(game.board());
  }

  // Attempt invalid move
  try {
    game.move('Ia1-a5'); // Infantry can only move 1 square
  } catch (e) {
    console.log('\nInvalid move blocked:', (e as Error).message);
  }

  // Check game state
  console.log('\nGame state:');
  console.log('In check?', game.isCheck());
  console.log('Checkmate?', game.isCheckmate());
  console.log('Turn:', game.turn());
  console.log('Move number:', game.moveNumber());
}

// Run the demo
runDemo();