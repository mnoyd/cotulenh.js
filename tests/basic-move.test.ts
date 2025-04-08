import {
  CoTuLenh,
  TANK,
  RED,
  Move, // Import Move type for verbose output
  Square, // Import Square type
  PieceSymbol, // Import PieceSymbol
  AIR_FORCE, // Import AIR_FORCE
} from '../src/cotulenh'

// Simplified helper to check if a move exists in the verbose list
// (We don't need all options of findVerboseMove for these basic tests)
const findMove = (
  moves: Move[],
  from: Square,
  to: Square,
): Move | undefined => {
  return moves.find(
    (m) => m.from === from && m.to === to && !m.isDeploy && !m.isStayCapture(),
  )
}

// Helper to extract just the 'to' squares for simple comparison
const getDestinationSquares = (moves: Move[]): Square[] => {
  return moves.map((m) => m.to).sort()
}

describe('Basic TANK Moves on Empty Board', () => {
  let game: CoTuLenh

  beforeEach(() => {
    game = new CoTuLenh()
    game.clear()
    game['_turn'] = RED // Set turn for the piece being tested
  })

  it('should return correct moves for TANK in the middle (e4 - Land)', () => {
    const startSquare: Square = 'e4'
    game.put({ type: TANK, color: RED }, startSquare)

    // Get verbose moves for the tank at e4
    const moves = game.moves({
      square: startSquare,
      verbose: true,
      ignoreSafety: true,
    }) as Move[]

    const expectedDestinations: Square[] = [
      'c4',
      'd4',
      'f4',
      'g4',
      'e2',
      'e3',
      'e5',
      'e6',
    ].sort()
    const actualDestinations = getDestinationSquares(moves)

    // Check specific moves exist
    expect(findMove(moves, startSquare, 'd4')).toBeDefined()
    expect(findMove(moves, startSquare, 'f4')).toBeDefined()
    expect(findMove(moves, startSquare, 'e3')).toBeDefined()
    expect(findMove(moves, startSquare, 'e5')).toBeDefined()

    // Check the overall list of destinations
    expect(actualDestinations).toEqual(expectedDestinations)
    expect(moves).toHaveLength(8) // Ensure only the expected moves are present
  })

  it('should return NO moves for TANK at the edge (a1 - Navy)', () => {
    const startSquare: Square = 'a1'
    game.put({ type: TANK, color: RED }, startSquare)

    const moves = game.moves({
      square: startSquare,
      verbose: true,
      ignoreSafety: true,
    }) as Move[]
    const actualDestinations = getDestinationSquares(moves)

    expect(actualDestinations).toEqual([])
    expect(moves).toHaveLength(0)
  })

  it('should return NO moves for TANK at the coast (c6 - Coast/River)', () => {
    const startSquare: Square = 'c6'
    game.put({ type: TANK, color: RED }, startSquare)

    const moves = game.moves({
      square: startSquare,
      verbose: true,
      ignoreSafety: true,
    }) as Move[]

    const expectedDestinations: Square[] = [
      'c4',
      'c5',
      'c7',
      'c8',
      'd6',
      'e6',
    ].sort()
    const actualDestinations = getDestinationSquares(moves)

    // Check specific moves exist
    expect(findMove(moves, startSquare, 'c4')).toBeDefined()
    expect(findMove(moves, startSquare, 'c5')).toBeDefined()
    expect(findMove(moves, startSquare, 'c7')).toBeDefined()
    expect(findMove(moves, startSquare, 'c8')).toBeDefined()
    expect(findMove(moves, startSquare, 'd6')).toBeDefined()
    expect(findMove(moves, startSquare, 'e6')).toBeDefined()

    // Check the overall list of destinations
    expect(actualDestinations).toEqual(expectedDestinations)
    expect(moves).toHaveLength(6) // Ensure only the expected moves are present
  })

  // TODO: Add more Tank tests (corners, edges, near river)
})

describe('Basic AIR_FORCE Moves on Empty Board', () => {
  let game: CoTuLenh

  beforeEach(() => {
    game = new CoTuLenh()
    game.clear()
    game['_turn'] = RED // Set turn for the piece being tested
  })

  test('Air Force basic moves from g5 (Land)', () => {
    const startSquare: Square = 'g5'
    game.put({ type: AIR_FORCE, color: RED }, startSquare)

    // Use verbose moves as required by findMove helper
    const moves = game.moves({
      square: startSquare,
      verbose: true,
      ignoreSafety: true,
    }) as Move[]
    const actualDestinations = getDestinationSquares(moves)

    // Air Force moves one square in any direction to land/mixed/air
    //prettier-ignore
    const expectedDestinations: Square[] = [
    'c9',                   'g9',                   'k9',
          'd8',             'g8',             'j8',
                'e7',       'g7',       'i7',
                      'f6', 'g6', 'h6',
    'c5', 'd5', 'e5', 'f5',       'h5', 'i5', 'j5', 'k5',
                      'f4', 'g4', 'h4',
                'e3',       'g3',       'i3',
          'd2',             'g2',             'j2',
    'c1',                   'g1',                   'k1'
    ].sort();

    // Check individual moves
    expectedDestinations.forEach((dest) => {
      expect(findMove(moves, startSquare, dest)).toBeDefined()
    })

    // Check the overall list of destinations
    expect(actualDestinations).toEqual(expectedDestinations)
    expect(moves).toHaveLength(expectedDestinations.length)
  })

  test('Air Force basic moves from c5 (Coast)', () => {
    const startSquare: Square = 'c5'
    game.put({ type: AIR_FORCE, color: RED }, startSquare)

    const moves = game.moves({
      square: startSquare,
      verbose: true,
      ignoreSafety: true,
    }) as Move[]
    const actualDestinations = getDestinationSquares(moves)
    //prettier-ignore
    const expectedDestinations: Square[] = [
      'c9',                   'g9',
      'c8',             'f8',
      'c7',       'e7',
      'c6', 'd6',
            'd5', 'e5', 'f5', 'g5',
      'c4', 'd4',
      'c3',       'e3',
      'c2',             'f2',
      'c1',                   'g1',
      ].sort();

    expectedDestinations.forEach((dest) => {
      expect(findMove(moves, startSquare, dest)).toBeDefined()
    })
    expect(actualDestinations).toEqual(expectedDestinations)
    expect(moves).toHaveLength(expectedDestinations.length)
  })

  test('Air Force basic moves from a1 (Water)', () => {
    const startSquare: Square = 'a1'
    game.put({ type: AIR_FORCE, color: RED }, startSquare)

    const moves = game.moves({
      square: startSquare,
      verbose: true,
      ignoreSafety: true,
    }) as Move[]
    const actualDestinations = getDestinationSquares(moves)
    // Air Force can move to adjacent land/water/mixed
    //prettier-ignore
    const expectedDestinations: Square[] = [
                      'e5',
                'd4',
          'c3',

          'c1', 'd1', 'e1',
          ].sort();

    expectedDestinations.forEach((dest) => {
      expect(findMove(moves, startSquare, dest)).toBeDefined()
    })
    expect(actualDestinations).toEqual(expectedDestinations)
    expect(moves).toHaveLength(expectedDestinations.length)
  })

  // TODO: Add more Air Force tests (corners, edges, over water)
})

// Add tests for other pieces (e.g., NAVY unit on these squares)
// Example: NAVY on e4 (Land) should likely have 0 moves
// Example: NAVY on a1 (Navy) should have moves like a2, b1
