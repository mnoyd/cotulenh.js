import {
  CoTuLenh,
  RED,
  BLUE,
  COMMANDER,
  INFANTRY,
  TANK,
  ARTILLERY,
  NAVY,
  AIR_FORCE,
  Move,
} from '../src/cotulenh'

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

// --- Demo Scenarios ---

// Scenario 1: Tank (land) stays on land, Navy (water) in deep water
function scenario1_LandCapturesNavyAtSea() {
  console.log(
    '\n--- SCENARIO 1: Land (Tank) captures Navy at Sea (Must Stay) ---',
  )
  const game = new CoTuLenh()
  game.clear()
  game.put({ type: TANK, color: RED }, 'd4')
  game.put({ type: NAVY, color: BLUE }, 'd2') // d2 is sea
  game.put({ type: COMMANDER, color: RED }, 'a12') // Add commanders to avoid game over check issues
  game.put({ type: COMMANDER, color: BLUE }, 'k1')
  game.load(game.fen().replace(/\s+[wb]\s+/, ` ${RED} `)) // Set turn to Red

  game.printBoard()
  const moves = game.moves({ square: 'd4', verbose: true })
  printMoves('Moves for Red Tank at d4', moves)

  // Tank should only have stay capture option: Td4xd2=
  const move = game.move({ from: 'd4', to: 'd2', stay: true }) // Explicitly try stay
  if (move) {
    console.log(`\nExecuted move: ${move.san}`)
    game.printBoard()
    console.log(`Tank stayed at ${move.to}? ${move.to === 'd4'}`)
  } else {
    console.log('\nFailed to execute stay capture Td4xd2=')
  }
  // Try replace capture (should fail or not exist)
  try {
    const replaceMove = game.move({ from: 'd4', to: 'd2', stay: false })
    if (replaceMove) {
      console.log(`\nERROR: Allowed replace capture Td4xd2: ${replaceMove.san}`)
      game.printBoard()
    }
  } catch (e) {
    console.log(
      `\nCorrectly blocked replace capture Td4xd2: ${(e as Error).message}`,
    )
  }
}

// Scenario 2: Navy in shallow water (mix), capturing land piece
function scenario2_NavyCapturesLandNotCoast() {
  console.log(
    '\n--- SCENARIO 2: Navy captures Land (not coast/bank) (Can Choose Stay/Replace) ---',
  )
  const game = new CoTuLenh()
  game.clear()
  game.put({ type: NAVY, color: RED }, 'f2') // f2 is sea
  game.put({ type: INFANTRY, color: BLUE }, 'f5') // f5 is normal land
  game.put({ type: COMMANDER, color: RED }, 'a12')
  game.put({ type: COMMANDER, color: BLUE }, 'k1')
  game.load(game.fen().replace(/\s+[wb]\s+/, ` ${RED} `))

  game.printBoard()
  const moves = game.moves({ square: 'f2', verbose: true })
  printMoves('Moves for Red Navy at f2', moves) // Should show Nf2xf5 and Nf2xf5=

  // Execute stay capture
  const stayMove = game.move({ from: 'f2', to: 'f5', stay: true })
  if (stayMove) {
    console.log(`\nExecuted STAY capture: ${stayMove.san}`)
    game.printBoard()
    console.log(`Navy stayed at ${stayMove.to}? ${stayMove.to === 'f2'}`)
    game.undo() // Undo to try the other option
    console.log('\nUndid move.')
    game.printBoard()
  } else {
    console.log('\nFailed to execute stay capture Nf2xf5=')
  }

  // Execute replace capture
  const replaceMove = game.move({ from: 'f2', to: 'f5', stay: false })
  if (replaceMove) {
    console.log(`\nExecuted REPLACE capture: ${replaceMove.san}`)
    game.printBoard()
    console.log(`Navy moved to ${replaceMove.to}? ${replaceMove.to === 'f5'}`)
  } else {
    console.log('\nFailed to execute replace capture Nf2xf5')
  }
}

// Scenario 3: Navy in mix terrain (coast), capturing on coast
function scenario3_NavyCapturesLandOnCoast() {
  console.log(
    '\n--- SCENARIO 3: Navy captures Land on Coast (Must Replace) ---',
  )
  const game = new CoTuLenh()
  game.clear()
  game.put({ type: NAVY, color: RED }, 'f2') // f2 is sea
  game.put({ type: INFANTRY, color: BLUE }, 'f4') // f4 is coast
  game.put({ type: COMMANDER, color: RED }, 'a12')
  game.put({ type: COMMANDER, color: BLUE }, 'k1')
  game.load(game.fen().replace(/\s+[wb]\s+/, ` ${RED} `))

  game.printBoard()
  const moves = game.moves({ square: 'f2', verbose: true })
  printMoves('Moves for Red Navy at f2', moves) // Should only show Nf2xf4

  // Try stay capture (should fail or not exist)
  try {
    const stayMove = game.move({ from: 'f2', to: 'f4', stay: true })
    if (stayMove) {
      console.log(`\nERROR: Allowed stay capture Nf2xf4=: ${stayMove.san}`)
      game.printBoard()
    }
  } catch (e) {
    console.log(
      `\nCorrectly blocked stay capture Nf2xf4=: ${(e as Error).message}`,
    )
  }

  // Execute replace capture
  const replaceMove = game.move({ from: 'f2', to: 'f4', stay: false })
  if (replaceMove) {
    console.log(`\nExecuted REPLACE capture: ${replaceMove.san}`)
    game.printBoard()
    console.log(`Navy moved to ${replaceMove.to}? ${replaceMove.to === 'f4'}`)
  } else {
    console.log('\nFailed to execute replace capture Nf2xf4')
  }
}

// Scenario 4: Air Force on land, Navy in deep water
function scenario4_AirForceCapturesNavyAtSea() {
  console.log(
    '\n--- SCENARIO 4: Air Force captures Navy at Sea (Must Stay) ---',
  )
  const game = new CoTuLenh()
  game.clear()
  game.put({ type: AIR_FORCE, color: RED }, 'e5')
  game.put({ type: NAVY, color: BLUE }, 'e2') // e2 is sea
  game.put({ type: COMMANDER, color: RED }, 'a12')
  game.put({ type: COMMANDER, color: BLUE }, 'k1')
  game.load(game.fen().replace(/\s+[wb]\s+/, ` ${RED} `))

  game.printBoard()
  const moves = game.moves({ square: 'e5', verbose: true })
  printMoves('Moves for Red Air Force at e5', moves) // Should only show Fe5xe2=

  // Try replace capture (should fail or not exist)
  try {
    const replaceMove = game.move({ from: 'e5', to: 'e2', stay: false })
    if (replaceMove) {
      console.log(`\nERROR: Allowed replace capture Fe5xe2: ${replaceMove.san}`)
      game.printBoard()
    }
  } catch (e) {
    console.log(
      `\nCorrectly blocked replace capture Fe5xe2: ${(e as Error).message}`,
    )
  }

  // Execute stay capture
  const stayMove = game.move({ from: 'e5', to: 'e2', stay: true })
  if (stayMove) {
    console.log(`\nExecuted STAY capture: ${stayMove.san}`)
    game.printBoard()
    console.log(`Air Force stayed at ${stayMove.to}? ${stayMove.to === 'e5'}`)
  } else {
    console.log('\nFailed to execute stay capture Fe5xe2=')
  }
}

// Scenario 5: Air Force on mix terrain (hill), capturing land
function scenario5_AirForceCapturesLand() {
  console.log(
    '\n--- SCENARIO 5: Air Force captures Land (Can Choose Stay/Replace) ---',
  )
  const game = new CoTuLenh()
  game.clear()
  game.put({ type: AIR_FORCE, color: RED }, 'e5')
  game.put({ type: INFANTRY, color: BLUE }, 'e6') // e6 is land
  game.put({ type: COMMANDER, color: RED }, 'a12')
  game.put({ type: COMMANDER, color: BLUE }, 'k1')
  game.load(game.fen().replace(/\s+[wb]\s+/, ` ${RED} `))

  game.printBoard()
  const moves = game.moves({ square: 'e5', verbose: true })
  printMoves('Moves for Red Air Force at e5', moves) // Should show Fe5xe6 and Fe5xe6=

  // Execute stay capture
  const stayMove = game.move({ from: 'e5', to: 'e6', stay: true })
  if (stayMove) {
    console.log(`\nExecuted STAY capture: ${stayMove.san}`)
    game.printBoard()
    console.log(`Air Force stayed at ${stayMove.to}? ${stayMove.to === 'e5'}`)
    game.undo()
    console.log('\nUndid move.')
    game.printBoard()
  } else {
    console.log('\nFailed to execute stay capture Fe5xe6=')
  }

  // Execute replace capture
  const replaceMove = game.move({ from: 'e5', to: 'e6', stay: false })
  if (replaceMove) {
    console.log(`\nExecuted REPLACE capture: ${replaceMove.san}`)
    game.printBoard()
    console.log(
      `Air Force moved to ${replaceMove.to}? ${replaceMove.to === 'e6'}`,
    )
  } else {
    console.log('\nFailed to execute replace capture Fe5xe6')
  }
}

// Run the scenarios
scenario1_LandCapturesNavyAtSea()
scenario2_NavyCapturesLandNotCoast()
scenario3_NavyCapturesLandOnCoast()
scenario4_AirForceCapturesNavyAtSea()
scenario5_AirForceCapturesLand()

console.log('\n--- DEMO COMPLETE ---')
