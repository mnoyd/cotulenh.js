import {
  CoTuLenh,
  NAVY,
  TANK,
  INFANTRY,
  RED,
  BLUE,
  Move,
  ARTILLERY,
  AIR_FORCE,
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
