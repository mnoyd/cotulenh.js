import {
  CoTuLenh,
  Move,
  RED,
  BLUE,
  NAVY,
  AIR_FORCE,
  INFANTRY,
  MILITIA,
  COMMANDER,
  TANK,
  ENGINEER,
  ARTILLERY,
  ANTI_AIR,
  MISSILE,
  HEADQUARTER,
  Square,
  PieceSymbol,
  DEFAULT_POSITION,
} from '../src/cotulenh'

// Helper to find a specific move in the verbose move list
const findVerboseMove = (
  moves: Move[],
  from: Square,
  to: Square, // Destination or Target
  options: {
    piece?: PieceSymbol
    isDeploy?: boolean
    isStayCapture?: boolean // Option parameter
  } = {},
): Move | undefined => {
  return moves.find((m) => {
    // 'm' is an instance of the Move class
    const matchFrom = m.from === from
    const matchPiece = options.piece === undefined || m.piece === options.piece
    const matchDeploy =
      options.isDeploy === undefined || m.isDeploy === options.isDeploy
    // Check stay capture based on properties, not a method call
    const isActuallyStayCapture =
      m.targetSquare !== undefined && m.to === m.from
    const matchStay =
      options.isStayCapture === undefined ||
      isActuallyStayCapture === options.isStayCapture

    // Adjust 'to' matching based on stay capture
    const matchTo = options.isStayCapture
      ? m.to === from && m.targetSquare === to // Stay capture: 'to' is origin, 'targetSquare' is target
      : m.to === to // Normal move/deploy: 'to' is destination

    return matchFrom && matchPiece && matchDeploy && matchStay && matchTo
  })
}

describe('CoTuLenh Stay Capture Logic', () => {
  let game: CoTuLenh

  beforeEach(() => {
    game = new CoTuLenh()
    game.clear()
  })

  test('Land piece (Tank) capturing on Land should REPLACE', () => {
    game.put({ type: TANK, color: RED }, 'd4')
    game.put({ type: INFANTRY, color: BLUE }, 'd5')
    game['_turn'] = RED // Access private for test setup

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'd4', 'd5', {
      isStayCapture: false,
    })

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(false)
    expect(captureMove?.to).toBe('d5')
    expect(captureMove?.captured).toBe(INFANTRY)
  })

  test('Heavy piece (Artillery) capturing across river on Land should REPLACE', () => {
    game.put({ type: ARTILLERY, color: RED }, 'i5')
    game.put({ type: INFANTRY, color: BLUE }, 'i8')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'i5', 'i8', {
      isStayCapture: false,
    })

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(false)
    expect(captureMove?.to).toBe('i8')
    expect(captureMove?.captured).toBe(INFANTRY)
  })

  test('Navy capturing Navy on Water should REPLACE', () => {
    game.put({ type: NAVY, color: RED }, 'b3')
    game.put({ type: NAVY, color: BLUE }, 'b5')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'b3', 'b5', {
      isStayCapture: false,
    })

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(false)
    expect(captureMove?.to).toBe('b5')
    expect(captureMove?.captured).toBe(NAVY)
  })

  test('Navy capturing Land piece on Mixed terrain (c file) should REPLACE', () => {
    game.put({ type: NAVY, color: RED }, 'c4')
    game.put({ type: TANK, color: BLUE }, 'c5')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'c4', 'c5', {
      isStayCapture: false,
    })

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(false)
    expect(captureMove?.to).toBe('c5')
    expect(captureMove?.captured).toBe(TANK)
  })

  test('Land piece (Tank) capturing Navy on pure Water should STAY', () => {
    // Tank d3, Navy b3
    game.put({ type: TANK, color: RED }, 'd3')
    game.put({ type: NAVY, color: BLUE }, 'b3')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'd3', 'b3', {
      isStayCapture: true,
    }) // Target is b3

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(true)
    expect(captureMove?.from).toBe('d3')
    expect(captureMove?.to).toBe('d3') // Tank stays
    expect(captureMove?.captured).toBe(NAVY)
    expect(captureMove?.targetSquare).toBe('b3')
  })

  test('Navy capturing Land piece on pure Land should STAY', () => {
    // Navy c3, Tank f3 (range 3)
    game.put({ type: NAVY, color: RED }, 'c3')
    game.put({ type: TANK, color: BLUE }, 'f3')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'c3', 'f3', {
      isStayCapture: true,
    }) // Target is f3

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(true)
    expect(captureMove?.from).toBe('c3')
    expect(captureMove?.to).toBe('c3') // Navy stays
    expect(captureMove?.captured).toBe(TANK)
    expect(captureMove?.targetSquare).toBe('f3')
  })

  test('Air Force capturing Navy on pure Water should STAY', () => {
    // AF d2, Navy b2
    game.put({ type: AIR_FORCE, color: RED }, 'd2')
    game.put({ type: NAVY, color: BLUE }, 'b2')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'd2', 'b2', {
      isStayCapture: true,
    }) // Target is b2

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(true)
    expect(captureMove?.from).toBe('d2')
    expect(captureMove?.to).toBe('d2') // AF stays
    expect(captureMove?.captured).toBe(NAVY)
    expect(captureMove?.targetSquare).toBe('b2')
  })

  test('Air Force capturing Land piece on Land should REPLACE', () => {
    game.put({ type: AIR_FORCE, color: RED }, 'd4')
    game.put({ type: INFANTRY, color: BLUE }, 'd5')
    game['_turn'] = RED

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findVerboseMove(moves, 'd4', 'd5', {
      isStayCapture: false,
    })

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture).toBe(false)
    expect(captureMove?.to).toBe('d5')
    expect(captureMove?.captured).toBe(INFANTRY)
  })
})

describe('Move History and Undo', () => {
  let game: CoTuLenh
  beforeEach(() => {
    game = new CoTuLenh(DEFAULT_POSITION) // Start with default position
  })

  test('history() should record moves correctly (simple and verbose)', () => {
    const move1 = game.move({ from: 'c5', to: 'c6' }) // Red Infantry forward
    const move2 = game.move({ from: 'g8', to: 'g7' }) // Blue Militia forward

    expect(move1).not.toBeNull()
    expect(move2).not.toBeNull()

    const historySimple = game.history()
    const historyVerbose = game.history({ verbose: true }) as Move[]

    // Basic SAN check - exact format depends on _moveToSan implementation details
    expect(historySimple.length).toBe(2)
    expect(historySimple[0]).toMatch(/^Ic5-c6/)
    expect(historySimple[1]).toMatch(/^Mg8-g7/)

    expect(historyVerbose.length).toBe(2)
    expect(historyVerbose[0].from).toBe('c5')
    expect(historyVerbose[0].to).toBe('c6')
    expect(historyVerbose[1].from).toBe('g8')
    expect(historyVerbose[1].to).toBe('g7')
  })

  test('undo() should revert the last move', () => {
    const initialFen = game.fen()
    game.move({ from: 'd3', to: 'd4' }) // Red Tank
    const fenAfterMove = game.fen()
    expect(fenAfterMove).not.toBe(initialFen)

    game.undo()
    const fenAfterUndo = game.fen()

    expect(fenAfterUndo).toBe(initialFen)
    expect(game.history().length).toBe(0)
    expect(game.turn()).toBe(RED) // Turn should revert
  })

  test('undo() multiple moves', () => {
    const initialFen = game.fen()
    game.move({ from: 'd3', to: 'd4' }) // R Tank
    const fen1 = game.fen()
    game.move({ from: 'e9', to: 'e8' }) // B AntiAir
    const fen2 = game.fen()
    game.move({ from: 'f4', to: 'f6' }) // R Tank
    const fen3 = game.fen()

    expect(game.history().length).toBe(3)

    game.undo() // Undo f4f6
    expect(game.history().length).toBe(2)
    expect(game.turn()).toBe(RED)
    expect(game.fen()).toBe(fen2)
    expect(game.get('f6')).toBeUndefined()
    expect(game.get('f4')?.type).toBe(TANK)

    game.undo() // Undo e9e8
    expect(game.history().length).toBe(1)
    expect(game.turn()).toBe(BLUE)
    expect(game.fen()).toBe(fen1)
    expect(game.get('e8')).toBeUndefined()
    expect(game.get('e9')?.type).toBe(ANTI_AIR)

    game.undo() // Undo d3d4
    expect(game.history().length).toBe(0)
    expect(game.turn()).toBe(RED)
    expect(game.fen()).toBe(initialFen)
  })

  test('undo() a stay capture move', () => {
    // Setup: Red Air Force d2, Blue Navy b2
    game.load('11/11/11/11/11/11/11/11/11/11/1n1F7/11 r - - 0 1')
    const initialFen = game.fen()
    const move = game.move({ from: 'd2', to: 'b2', stay: true }) // AF attacks Navy

    expect(move).not.toBeNull()
    expect(game.get('d2')?.type).toBe(AIR_FORCE) // AF stays
    expect(game.get('b2')).toBeUndefined() // Navy removed
    const fenAfterMove = game.fen()

    game.undo()

    expect(game.fen()).toBe(initialFen)
    expect(game.get('d2')?.type).toBe(AIR_FORCE)
    expect(game.get('b2')?.type).toBe(NAVY)
    expect(game.get('b2')?.color).toBe(BLUE)
    expect(game.history().length).toBe(0)
    expect(game.turn()).toBe(RED)
  })
})

describe('SAN Conversion', () => {
  let game: CoTuLenh
  beforeEach(() => {
    game = new CoTuLenh(DEFAULT_POSITION)
  })

  test('move() should accept basic SAN strings', () => {
    const initialFen = game.fen()
    // Use a valid move from the default position
    const move = game.move('c5-c6') // Red Infantry

    expect(move).not.toBeNull()
    expect(move?.san).toBe('Ic5-c6') // Basic SAN format
    expect(game.fen()).not.toBe(initialFen)
    expect(game.get('c5')).toBeUndefined()
    expect(game.get('c6')?.type).toBe(INFANTRY)
    expect(game.get('c6')?.color).toBe(RED)
  })

  test('move() should handle SAN for captures', () => {
    // Setup: Red Infantry d4, Blue Infantry d5
    game.load('11/11/11/11/11/11/11/3i7/3I7/11/11/11 r - - 0 1')
    const move = game.move('Id4xd5') // Capture using SAN

    expect(move).not.toBeNull()
    expect(move?.san).toBe('Id4xd5')
    expect(move?.captured).toBe(INFANTRY)
    expect(game.get('d5')?.type).toBe(INFANTRY)
    expect(game.get('d5')?.color).toBe(RED)
    expect(game.get('d4')).toBeUndefined()
  })

  test('move() should handle SAN for stay captures', () => {
    // Setup: Red AF d2, Blue Navy b2
    game.load('11/11/11/11/11/11/11/11/11/11/1n1F7/11 r - - 0 1')
    const move = game.move('Fd2<b2') // Stay capture SAN

    expect(move).not.toBeNull()
    expect(move?.isStayCapture).toBe(true)
    expect(move?.san).toBe('Fd2<b2')
    expect(move?.from).toBe('d2')
    expect(move?.to).toBe('d2') // Piece ends up at origin
    expect(move?.targetSquare).toBe('b2') // Target was b2
    expect(move?.captured).toBe(NAVY)
    expect(game.get('d2')?.type).toBe(AIR_FORCE)
    expect(game.get('b2')).toBeUndefined()
  })

  // TODO: Add tests for _moveToSan and _moveFromSan directly if needed for more granular checks
  // TODO: Add tests for ambiguous moves SAN if applicable
  // TODO: Add tests for Heroic promotion SAN if implemented
  // TODO: Add tests for Deploy SAN parsing/generation
})

describe('Stack Movement and Deployment', () => {
  let game: CoTuLenh

  beforeEach(() => {
    game = new CoTuLenh()
    game.clear() // Start with an empty board for specific setups
  })

  test('Generate deploy moves for (NFT) stack', () => {
    // Setup: Red Navy at c3 carrying AirForce and Tank
    game.put(
      {
        type: NAVY,
        color: RED,
        carried: [
          { type: AIR_FORCE, color: RED },
          { type: TANK, color: RED },
        ],
      },
      'c3',
    )
    game['_turn'] = RED // Set turn for testing

    const moves = game.moves({ verbose: true, square: 'c3' }) as Move[]

    // Expect deploy moves for F and T, plus carrier moves for N
    const deployF_c4 = findVerboseMove(moves, 'c3', 'c4', {
      piece: AIR_FORCE,
      isDeploy: true,
      isStayCapture: false,
    })
    const deployF_d4 = findVerboseMove(moves, 'c3', 'd4', {
      piece: AIR_FORCE,
      isDeploy: true,
      isStayCapture: false,
    })
    const deployT_c4 = findVerboseMove(moves, 'c3', 'c4', {
      piece: TANK,
      isDeploy: true,
      isStayCapture: false,
    })
    const deployT_d3 = findVerboseMove(moves, 'c3', 'd3', {
      piece: TANK,
      isDeploy: true,
      isStayCapture: false,
    })
    const carrierN_c4 = findVerboseMove(moves, 'c3', 'c4', {
      piece: NAVY,
      isDeploy: false,
      isStayCapture: false,
    })

    expect(deployF_c4).toBeDefined()
    expect(deployF_c4?.isDeploy).toBe(true)
    expect(deployF_c4?.piece).toBe(AIR_FORCE)

    expect(deployF_d4).toBeDefined() // Check another direction

    expect(deployT_c4).toBeDefined()
    expect(deployT_c4?.isDeploy).toBe(true)
    expect(deployT_c4?.piece).toBe(TANK)

    expect(deployT_d3).toBeDefined() // Check another direction

    expect(carrierN_c4).toBeDefined()
    expect(carrierN_c4?.isDeploy).toBe(false)
    expect(carrierN_c4?.piece).toBe(NAVY)

    // Check a non-deploy move is not generated for carried pieces
    const nonDeployF = findVerboseMove(moves, 'c3', 'c4', {
      piece: AIR_FORCE,
      isDeploy: false,
    })
    expect(nonDeployF).toBeUndefined()
  })

  test('Execute Air Force deploy move from (NFT) stack', () => {
    // Setup: Red Navy at c3 carrying AirForce and Tank
    game.put(
      {
        type: NAVY,
        color: RED,
        carried: [
          { type: AIR_FORCE, color: RED },
          { type: TANK, color: RED },
        ],
      },
      'c3',
    )
    game['_turn'] = RED

    // Find and execute the deploy move for Air Force to c4
    // We need a way to represent deploy moves in the public API.
    // Option 1: Use a special SAN format (requires _moveFromSan update)
    // Option 2: Extend the move object { from, to, piece, isDeploy } (cleaner?)
    // Let's assume we can find the internal move and use the object format for now.

    const deployMove = findVerboseMove(
      game.moves({ verbose: true, square: 'c3' }) as Move[],
      'c3',
      'c4',
      { piece: AIR_FORCE, isDeploy: true },
    )
    expect(deployMove).toBeDefined()

    // Execute using the found Move object (if move() accepts it - needs check)
    // Or construct a simpler object if move() supports it
    const moveResult = game.move({ from: 'c3', to: 'c4' }) // Hypothetical API

    expect(moveResult).not.toBeNull()
    expect(game.turn()).toBe(RED) // Turn should NOT change
    expect(game.get('c3')?.type).toBe(NAVY) // Carrier remains
    expect(game.get('c3')?.carried?.length).toBe(1) // One piece left
    expect(game.get('c3')?.carried?.[0].type).toBe(TANK) // Tank remains
    expect(game.get('c4')?.type).toBe(AIR_FORCE) // AF deployed
    expect(game.get('c4')?.color).toBe(RED)
    // Cannot check private _deployState directly, check behavior instead
    // After a deploy move, only moves from the stack square should be possible
    const nextMoves = game.moves({ verbose: true }) as Move[]
    expect(nextMoves.every((m) => m.from === 'c3')).toBe(true) // All moves must originate from c3
    expect(
      findVerboseMove(nextMoves, 'c3', 'd3', { piece: TANK, isDeploy: true }),
    ).toBeDefined() // Tank deploy possible
    expect(
      findVerboseMove(nextMoves, 'c3', 'c2', { piece: NAVY, isDeploy: false }),
    ).toBeDefined() // Carrier move possible
  })

  test('Execute Tank deploy move after Air Force deploy', () => {
    // Setup: Red Navy at c3 carrying AirForce and Tank
    game.put(
      {
        type: NAVY,
        color: RED,
        carried: [
          { type: AIR_FORCE, color: RED },
          { type: TANK, color: RED },
        ],
      },
      'c3',
    )
    game['_turn'] = RED

    // Deploy AF first
    const afDeployMove = findVerboseMove(
      game.moves({ verbose: true, square: 'c3' }) as Move[],
      'c3',
      'c4',
      { piece: AIR_FORCE, isDeploy: true },
    )
    expect(afDeployMove).toBeDefined()
    game.move({ from: 'c3', to: 'c4' })

    expect(game.turn()).toBe(RED) // Still Red's turn

    // Now deploy Tank
    const tankDeployMove = findVerboseMove(
      game.moves({ verbose: true, square: 'c3' }) as Move[],
      'c3',
      'd3',
      { piece: TANK, isDeploy: true },
    )
    expect(tankDeployMove).toBeDefined()
    const moveResult = game.move({ from: 'c3', to: 'd3' })

    expect(moveResult).not.toBeNull()
    expect(game.turn()).toBe(RED) // Turn should still be Red
    expect(game.get('c3')?.type).toBe(NAVY) // Carrier remains
    expect(game.get('c3')?.carried).toBeUndefined() // Stack empty
    expect(game.get('c4')?.type).toBe(AIR_FORCE) // Previous deploy
    expect(game.get('d3')?.type).toBe(TANK) // Tank deployed
    expect(game.get('d3')?.color).toBe(RED)
    // Check deploy state behavior
    const nextMoves = game.moves({ verbose: true }) as Move[]
    expect(nextMoves.every((m) => m.from === 'c3')).toBe(true) // All moves must originate from c3 (only carrier left)
    expect(
      findVerboseMove(nextMoves, 'c3', 'c2', { piece: NAVY, isDeploy: false }),
    ).toBeDefined() // Carrier move possible
    expect(
      findVerboseMove(nextMoves, 'c3', 'any', { isDeploy: true }),
    ).toBeUndefined() // No more deploy moves
  })

  test('Execute Carrier move after all deployments', () => {
    // Setup: Red Navy at c3 carrying AirForce and Tank
    game.put(
      {
        type: NAVY,
        color: RED,
        carried: [
          { type: AIR_FORCE, color: RED },
          { type: TANK, color: RED },
        ],
      },
      'c3',
    )
    game['_turn'] = RED

    // Deploy AF
    game.move({ from: 'c3', to: 'c4' })
    // Deploy T
    game.move({ from: 'c3', to: 'd3' })

    expect(game.turn()).toBe(RED) // Still Red's turn
    expect(game.get('c3')?.carried).toBeUndefined() // Stack empty

    // Find and execute the carrier move (e.g., Navy c3 to c2)
    const carrierMove = findVerboseMove(
      game.moves({ verbose: true, square: 'c3' }) as Move[],
      'c3',
      'c2',
      { piece: NAVY, isDeploy: false },
    )
    expect(carrierMove).toBeDefined()
    const moveResult = game.move({ from: 'c3', to: 'c2' }) // Normal move object for carrier

    expect(moveResult).not.toBeNull()
    expect(game.turn()).toBe(BLUE) // Turn SHOULD change now
    expect(game.get('c3')).toBeUndefined() // Carrier moved
    expect(game.get('c2')?.type).toBe(NAVY) // Carrier at new location
    expect(game.get('c2')?.carried).toBeUndefined() // Still empty stack
    expect(game.get('c4')?.type).toBe(AIR_FORCE) // Deployed pieces remain
    expect(game.get('d3')?.type).toBe(TANK)
    // Check deploy state cleared by checking if non-stack moves are possible
    expect(game.moves({ square: 'c4' }).length).toBeGreaterThan(0)
  })

  // TODO: Add tests for deploy captures (normal and stay)
  // TODO: Add tests for undoing deploy/carrier moves
  // TODO: Add tests for SAN parsing/generation of deploy moves
})
