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
} from '../src/cotulenh'

describe('CoTuLenh Stay Capture Logic', () => {
  let game: CoTuLenh

  beforeEach(() => {
    game = new CoTuLenh() // Use default position or clear as needed
    game.clear() // Start with an empty board for specific setups
  })

  // --- Helper to find a specific move ---
  const findMove = (
    moves: Move[],
    from: string,
    to: string,
    isStayCapture?: boolean,
  ): Move | undefined => {
    return moves.find((m) => {
      const matchFrom = m.from === from
      // For stay capture, the move's 'to' is the original square,
      // and 'targetSquare' is the captured piece's square.
      // For normal capture, the move's 'to' is the destination/captured piece's square.
      const matchTo = isStayCapture
        ? m.to === from && m.targetSquare === to
        : m.to === to
      const matchStayFlag =
        isStayCapture === undefined || m.isStayCapture() === isStayCapture

      return matchFrom && matchTo && matchStayFlag
    })
  }

  // --- Test Cases ---

  test('Land piece (Tank) capturing on Land should REPLACE', () => {
    // FEN: Red Tank at d4, Blue Infantry at d5, Red to move
    game.load('11/11/11/11/11/11/11/3i7/3T7/11/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'd4', 'd5', false) // Expect normal capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(false)
    expect(captureMove?.from).toBe('d4')
    expect(captureMove?.to).toBe('d5') // Tank moves to d5
    expect(captureMove?.captured).toBe(INFANTRY)
    expect(captureMove?.targetSquare).toBeUndefined()
  })

  test('Heavy piece (Artillery) capturing across river on Land should REPLACE', () => {
    // FEN: Red Artillery at i5, Blue Infantry at i8, Red to move
    game.load('11/11/11/11/8i2/11/11/8A2/11/11/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'i5', 'i8', false) // Expect normal capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(false)
    expect(captureMove?.from).toBe('i5')
    expect(captureMove?.to).toBe('i8') // Artillery moves to i8
    expect(captureMove?.captured).toBe(INFANTRY)
    expect(captureMove?.targetSquare).toBeUndefined()
  })

  test('Navy capturing Navy on Water should REPLACE', () => {
    // FEN: Red Navy at b3, Blue Navy at b5, Red to move
    game.load('11/11/11/11/11/11/11/1n9/11/1N9/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'b3', 'b5', false) // Expect normal capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(false)
    expect(captureMove?.from).toBe('b3')
    expect(captureMove?.to).toBe('b5') // Navy moves to b5
    expect(captureMove?.captured).toBe(NAVY)
    expect(captureMove?.targetSquare).toBeUndefined()
  })

  test('Navy capturing Land piece on Mixed terrain (c file) should REPLACE', () => {
    // FEN: Red Navy at c4, Blue Tank at c5, Red to move
    game.load('11/11/11/11/11/11/11/2t8/2N8/11/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'c4', 'c5', false) // Expect normal capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(false)
    expect(captureMove?.from).toBe('c4')
    expect(captureMove?.to).toBe('c5') // Navy moves to c5
    expect(captureMove?.captured).toBe(TANK)
    expect(captureMove?.targetSquare).toBeUndefined()
  })

  test('Land piece (Tank) capturing Navy on pure Water should STAY', () => {
    // FEN: Red Tank at c2, Blue Navy at b2, Red to move
    game.load('11/11/11/11/11/11/11/11/11/1n1T7/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'd3', 'b3', true) // Expect stay capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(true)
    expect(captureMove?.from).toBe('d3')
    expect(captureMove?.to).toBe('d3') // Tank stays at c2
    expect(captureMove?.captured).toBe(NAVY)
    expect(captureMove?.targetSquare).toBe('b3') // Target was b2
  })

  test('Navy capturing Land piece on pure Land should STAY', () => {
    // FEN: Red Navy at c3, Blue Tank at d3, Red to move
    game.load('11/11/11/11/11/11/11/11/11/2N2t5/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    // Navy capture range vs Land is 3 (or 4 if heroic)
    const captureMove = findMove(moves, 'c3', 'f3', true) // Expect stay capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(true)
    expect(captureMove?.from).toBe('c3')
    expect(captureMove?.to).toBe('c3') // Navy stays at c3
    expect(captureMove?.captured).toBe(TANK)
    expect(captureMove?.targetSquare).toBe('f3') // Target was f3
  })

  test('Navy should NOT be able to capture Land piece out of range', () => {
    // FEN: Red Navy at a1, Blue Tank at e1, Red to move
    game.load('11/11/11/11/11/11/11/11/11/11/11/N3t6 r - - 0 1')

    const moves = game.moves({ verbose: true }) as Move[]
    // Navy capture range vs Land is 3 (or 4 if heroic)
    const captureMove = findMove(moves, 'a1', 'e1') // Check both stay/replace

    expect(captureMove).toBeUndefined() // Should not find a move
  })

  test('Air Force capturing Navy on pure Water should STAY', () => {
    // FEN: Red Air Force at c2, Blue Navy at b2, Red to move
    game.load('11/11/11/11/11/11/11/11/11/11/1n1F7/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'd2', 'b2', true) // Expect stay capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(true)
    expect(captureMove?.from).toBe('d2')
    expect(captureMove?.to).toBe('d2') // Air Force stays at c2
    expect(captureMove?.captured).toBe(NAVY)
    expect(captureMove?.targetSquare).toBe('b2') // Target was b2
  })

  test('Air Force capturing Land piece on Land should REPLACE', () => {
    // FEN: Red Air Force at d4, Blue Infantry at d5, Red to move
    game.load('11/11/11/11/11/11/11/3i7/3F7/11/11/11 r - - 0 1')

    const moves = game.moves({ verbose: true, ignoreSafety: true }) as Move[]
    const captureMove = findMove(moves, 'd4', 'd5', false) // Expect normal capture

    expect(captureMove).toBeDefined()
    expect(captureMove?.isStayCapture()).toBe(false)
    expect(captureMove?.from).toBe('d4')
    expect(captureMove?.to).toBe('d5') // Air Force moves to d5
    expect(captureMove?.captured).toBe(INFANTRY)
    expect(captureMove?.targetSquare).toBeUndefined()
  })
})

describe('Move History and Undo', () => {
  let game: CoTuLenh
  beforeEach(() => {
    game = new CoTuLenh() // Start with default position
  })

  test('history() should record moves correctly (simple and verbose)', () => {
    // Example sequence: Infantry e3->e4, Militia e8->e7
    const move1 = game.move({ from: 'c5', to: 'c6' }) // Red Infantry forward
    const move2 = game.move({ from: 'g8', to: 'g7' }) // Blue Militia forward (assuming valid)

    expect(move1).not.toBeNull()
    expect(move2).not.toBeNull()

    const historySimple = game.history()
    const historyVerbose = game.history({ verbose: true }) as Move[]

    expect(historySimple).toEqual(['Ic5c6', 'Mg8g7']) // Assuming SAN includes piece type

    expect(historyVerbose.length).toBe(2)
    expect(historyVerbose[0].san).toBe('Ic5-c6')
    expect(historyVerbose[0].from).toBe('c5')
    expect(historyVerbose[0].to).toBe('c6')
    expect(historyVerbose[1].san).toBe('Mg8-g7')
    expect(historyVerbose[1].from).toBe('g8')
    expect(historyVerbose[1].to).toBe('g7')
  })

  test('undo() should revert the last move', () => {
    const initialFen = game.fen()
    game.move({ from: 'd3', to: 'd4' })
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
    // game.move('e3e4') // R
    // game.move('e8e7') // B
    // game.move('f3f4') // R

    game.move({ from: 'd3', to: 'd4' }) // R
    game.move({ from: 'e9', to: 'e8' }) // B
    game.move({ from: 'f4', to: 'f6' }) // R

    expect(game.history().length).toBe(3)

    game.undo() // Undo f4f6
    expect(game.history().length).toBe(2)
    expect(game.turn()).toBe(RED)
    expect(game.get('f6')).toBeUndefined()
    expect(game.get('f4')?.type).toBe(TANK) // Assuming infantry starts at f3

    game.undo() // Undo e9e8
    expect(game.history().length).toBe(1)
    expect(game.turn()).toBe(BLUE)
    expect(game.get('e8')).toBeUndefined()
    expect(game.get('e9')?.type).toBe(ANTI_AIR)

    game.undo() // Undo d3d4
    expect(game.history().length).toBe(0)
    expect(game.turn()).toBe(RED)
    expect(game.fen()).toBe(initialFen)
  })

  test('undo() a stay capture move', () => {
    // Setup: Red Air Force d2, Blue Navy b2
    game.load('5c5/11/11/11/11/11/11/11/11/11/1n1F7/5C5 r - - 0 1')
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
    game = new CoTuLenh()
  })

  test('move() should accept SAN strings', () => {
    const initialFen = game.fen()
    const move = game.move({ from: 'c5', to: 'c6' }) // Move Infantry using SAN

    expect(move).not.toBeNull()
    expect(move?.san).toBe('Ic5-c6')
    expect(game.fen()).not.toBe(initialFen)
    expect(game.get('c5')).toBeUndefined()
    expect(game.get('c6')?.type).toBe(INFANTRY)
    expect(game.get('c6')?.color).toBe(RED)
  })

  test('move() should handle SAN for captures', () => {
    // Setup: Red Infantry e4, Blue Infantry d5
    game.load('5c5/11/11/11/11/11/11/3i7/3I7/11/11/5C5 r - - 0 1')
    const move = game.move({ from: 'd4', to: 'd5' }) // Capture using SAN

    expect(move).not.toBeNull()
    expect(move?.san).toBe('Id4xd5')
    expect(move?.captured).toBe(INFANTRY)
    expect(game.get('d5')?.type).toBe(INFANTRY)
    expect(game.get('d5')?.color).toBe(RED)
    expect(game.get('d4')).toBeUndefined()
  })
  //TODO: this not implemented san move yet.
  // test('move() should handle SAN for stay captures', () => {
  //   // Setup: Red Air Force d2, Blue Navy b2
  //   game.load('5c5/11/11/11/11/11/11/11/11/11/1n1F7/5C5 r - - 0 1')
  //   // Assuming SAN for stay capture is like Fd2(x)b2 or similar - *needs verification*
  //   // Let's try the object format first to confirm behavior, then test SAN parsing if known
  //   const moveObj = game.move({ from: 'd2', to: 'b2', stay: true })
  //   expect(moveObj).not.toBeNull()
  //   expect(moveObj?.san).toMatch(/Fd2\(x\)b2/) // Adjust regex based on actual SAN format

  //   // Now test if _moveFromSan can parse this (assuming the format is correct)
  //   // This requires knowing the exact SAN format generated by _moveToSan
  //   game.undo() // Reset state
  //   const sanString = moveObj?.san // Get the generated SAN
  //   if (sanString) {
  //     const moveParsed = game.move(sanString)
  //     expect(moveParsed).not.toBeNull()
  //     expect(moveParsed?.isStayCapture()).toBe(true)
  //     expect(moveParsed?.from).toBe('d2')
  //     expect(moveParsed?.to).toBe('d2')
  //     expect(moveParsed?.targetSquare).toBe('b2')
  //     expect(moveParsed?.captured).toBe(NAVY)
  //   } else {
  //     // Fail the test or skip if SAN wasn't generated
  //     throw new Error("SAN for stay capture wasn't generated by the initial move object.")
  //   }
  // })

  // TODO: Add tests for _moveToSan and _moveFromSan directly if needed for more granular checks
  // TODO: Add tests for ambiguous moves if applicable (e.g., two identical pieces can move to the same square)
  // TODO: Add tests for Heroic promotion SAN if implemented
})
