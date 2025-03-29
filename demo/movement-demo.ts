#!/usr/bin/env -S node --no-warnings

import { CoTuLenh, Move } from '../src/cotulenh';
// Helper to print moves
function printMoves(label: string, moves: string[] | Move[]) {
    console.log(`\n${label}:`)
    if (moves.length === 0) {
      console.log('(No legal moves)')
      return
    }
    if (typeof moves[0] === 'string') {
      console.log((moves as string[]).join(', '))
    } else {
      console.log((moves as Move[]).map((m) => m.san).join(', '))
    }
  }

function movementDemo() {
  const game = new CoTuLenh();
  game.clear();

  // Test 1: Terrain restriction (Light vs Navy zones)
  console.log("\n=== Test 1: Militia cannot enter navy zone ===");
  game.put({ type: 'm', color: 'r' }, 'c7');
  game.put({ type: 'n', color: 'b' }, 'a7');
  attemptMove(game, 'c7', 'a7');

  // Test 2: Piece blocking
  console.log("\n=== Test 2: Tank blocked by friendly piece ===");
  game.put({ type: 't', color: 'r' }, 'd6');
  game.put({ type: 'i', color: 'r' }, 'd7');
  attemptMove(game, 'd6', 'd8');

  // Test 3: Move range limitation
  console.log("\n=== Test 3: Artillery out of range ===");
  game.put({ type: 'a', color: 'r' }, 'e5');
  attemptMove(game, 'e5', 'e9');

  // Test 4: Heavy piece river crossing
  console.log("\n=== Test 4: Artillery can't cross river ===");
  game.put({ type: 'a', color: 'b' }, 'h6');
  attemptMove(game, 'h6', 'h5');

  // Test 5: Normal capture
  console.log("\n=== Test 5: Commander captures Missile ===");
  game.put({ type: 'c', color: 'b' }, 'f4');
  game.put({ type: 'm', color: 'b' }, 'g3');
  attemptMove(game, 'f4', 'g3');

  // Test 6: Stay capture
  console.log("\n=== Test 6: Missile stay-captures Artillery ===");
  game.put({ type: 'm', color: 'b' }, 'g3');
  game.put({ type: 'a', color: 'r' }, 'h3');
  attemptMove(game, 'g3', 'h3');

  // Test 7: Bridge crossing
  console.log("\n=== Test 7: Heavy crosses bridge to capture ===");
  game.put({ type: 'a', color: 'b' }, 'h7');
  game.put({ type: 't', color: 'r' }, 'h6');
  attemptMove(game, 'h7', 'h6');

  // Test 8: Air Force replacement rules
  console.log("\n=== Test 8: Air Force capture/replace logic ===");
  game.put({ type: 'g', color: 'r' }, 'i5');
  game.put({ type: 't', color: 'b' }, 'j5');
  game.put({ type: 'n', color: 'b' }, 'b8');
  
  // Land capture
  attemptMove(game, 'i5', 'j5');
  // Sea capture
  attemptMove(game, 'i5', 'b8');
  attemptMove(game, 'b8', 'c8');
}

function attemptMove(game: CoTuLenh, from: string, to: string) {
  console.log(`\nAttempting: ${from} -> ${to}`);
  game.put({ type: 'c', color: 'r' }, 'f12');
  game.put({ type: 'c', color: 'b' }, 'h1');
  console.log("Before:");
  game.printBoard();

  try {
    const moves = game.moves({ square: from, verbose: true })
    printMoves(`Moves for ${from}`, moves)
    const move = game.move({ from, to });
    console.log(`SUCCESS: ${move?.san}`);
    console.log("After:");
    game.printBoard();
  } catch (e) {
    console.log(`FAILED: ${(e as Error).message}`);
  }finally {
    game.clear();
  }
}

// Run the demo
movementDemo();
console.log("\nDemo complete! Check above output for:");
console.log("- Successful moves (green)");
console.log("- Failed attempts (red)");
console.log("- Board state after each successful move");