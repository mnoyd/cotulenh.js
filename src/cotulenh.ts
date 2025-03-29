/**
 * @license
 * Adapted from chess.js by Jeff Hlywa (jhlywa@gmail.com)
 * Copyright (c) 2024, Hoang Manh/cotulenh.js
 * All rights reserved.
 */

// --- Constants ---
export const RED = 'r' // Changed from WHITE
export const BLUE = 'b' // Changed from BLACK

// Piece Symbols based on user input
export const COMMANDER = 'c'
export const INFANTRY = 'i'
export const TANK = 't'
export const MILITIA = 'm'
export const ENGINEER = 'e' // Added Engineer
export const ARTILLERY = 'a'
export const ANTI_AIR = 'g'
export const MISSILE = 's'
export const AIR_FORCE = 'f'
export const NAVY = 'n'
export const HEADQUARTER = 'h'

// --- Types ---
export type Color = 'r' | 'b' // Updated Color type
export type PieceSymbol =
  | 'c'
  | 'i'
  | 't'
  | 'm'
  | 'e'
  | 'a'
  | 'g'
  | 's'
  | 'f'
  | 'n'
  | 'h' // Updated PieceSymbol

// Generate Square type for 11x12 board (a1 to k12)
const FILES = 'abcdefghijk'.split('') // 11 files
const RANKS = '12,11,10,9,8,7,6,5,4,3,2,1'.split(',') // 12 ranks

type SquareTuple = {
  [F in (typeof FILES)[number]]: {
    [R in (typeof RANKS)[number]]: `${F}${R}`
  }[(typeof RANKS)[number]]
}[(typeof FILES)[number]]

export type Square = SquareTuple

// Corrected FEN based on user input and standard additions, updated turn to RED
// NOTE: Engineer 'e' is not in this FEN. Needs clarification if it should be.
export const DEFAULT_POSITION =
  '6c4/1n2fh1hf2/3a2s2a1/2n1gt1tg2/2ie2m3i/11/11/2IE2M3I/2N1GT1TG2/3A2S2A1/1N2FH1HF2/6C4 r - - 0 1' // Changed 'w' to 'r'

export type Piece = {
  color: Color
  type: PieceSymbol
}

// --- 0x88 Style Board Representation (Adapted for 16x16) ---
// We use a 16x16 board (256 squares) to fit 11x12
// Square 0 = a12, Square 1 = b12, ..., Square 10 = k12
// Square 16 = a11, ..., Square 26 = k11
// ...
// Square 176 = a1, ..., Square 186 = k1

//prettier-ignore
const SQUARE_MAP: Record<Square, number> = {
  // Rank 12 (top)
  a12: 0x00, b12: 0x01, c12: 0x02, d12: 0x03, e12: 0x04, f12: 0x05, g12: 0x06, h12: 0x07, i12: 0x08, j12: 0x09, k12: 0x0A,
  // Rank 11
  a11: 0x10, b11: 0x11, c11: 0x12, d11: 0x13, e11: 0x14, f11: 0x15, g11: 0x16, h11: 0x17, i11: 0x18, j11: 0x19, k11: 0x1A,
  // Rank 10
  a10: 0x20, b10: 0x21, c10: 0x22, d10: 0x23, e10: 0x24, f10: 0x25, g10: 0x26, h10: 0x27, i10: 0x28, j10: 0x29, k10: 0x2A,
  // Rank 9
  a9: 0x30, b9: 0x31, c9: 0x32, d9: 0x33, e9: 0x34, f9: 0x35, g9: 0x36, h9: 0x37, i9: 0x38, j9: 0x39, k9: 0x3A,
  // Rank 8
  a8: 0x40, b8: 0x41, c8: 0x42, d8: 0x43, e8: 0x44, f8: 0x45, g8: 0x46, h8: 0x47, i8: 0x48, j8: 0x49, k8: 0x4A,
  // Rank 7
  a7: 0x50, b7: 0x51, c7: 0x52, d7: 0x53, e7: 0x54, f7: 0x55, g7: 0x56, h7: 0x57, i7: 0x58, j7: 0x59, k7: 0x5A,
  // Rank 6
  a6: 0x60, b6: 0x61, c6: 0x62, d6: 0x63, e6: 0x64, f6: 0x65, g6: 0x66, h6: 0x67, i6: 0x68, j6: 0x69, k6: 0x6A,
  // Rank 5
  a5: 0x70, b5: 0x71, c5: 0x72, d5: 0x73, e5: 0x74, f5: 0x75, g5: 0x76, h5: 0x77, i5: 0x78, j5: 0x79, k5: 0x7A,
  // Rank 4
  a4: 0x80, b4: 0x81, c4: 0x82, d4: 0x83, e4: 0x84, f4: 0x85, g4: 0x86, h4: 0x87, i4: 0x88, j4: 0x89, k4: 0x8A,
  // Rank 3
  a3: 0x90, b3: 0x91, c3: 0x92, d3: 0x93, e3: 0x94, f3: 0x95, g3: 0x96, h3: 0x97, i3: 0x98, j3: 0x99, k3: 0x9A,
  // Rank 2
  a2: 0xA0, b2: 0xA1, c2: 0xA2, d2: 0xA3, e2: 0xA4, f2: 0xA5, g2: 0xA6, h2: 0xA7, i2: 0xA8, j2: 0xA9, k2: 0xAA,
  // Rank 1 (bottom)
  a1: 0xB0, b1: 0xB1, c1: 0xB2, d1: 0xB3, e1: 0xB4, f1: 0xB5, g1: 0xB6, h1: 0xB7, i1: 0xB8, j1: 0xB9, k1: 0xBA
};

const NAVY_MASK = new Uint8Array(256);    // 1 = navigable by navy
const LAND_MASK = new Uint8Array(256);    // 1 = accessible by light pieces

// Initialize movement masks
function initMovementMasks() {
  for (let sq = 0; sq < 256; sq++) {
    if (!isSquareOnBoard(sq)) continue;  // Add validity check
    const f = file(sq);
    const r = rank(sq);
    const alg = algebraic(sq);

    // Navy operational areas (a-c files + specific squares)
    NAVY_MASK[sq] = f <= 2 || ['d6','e6','d7','e7'].includes(alg) ? 1 : 0;

    // Land pieces operational areas (c-k files)
    LAND_MASK[sq] = f >= 2 ? 1 : 0;
  }
}
initMovementMasks();


// --- Helper Functions ---

// Check if a square index is on the 11x12 board within the 16x16 grid
function isSquareOnBoard(sq: number): boolean {
  const r = rank(sq)
  const f = file(sq)
  return r >= 0 && r < 12 && f >= 0 && f < 11
}

// Extracts the zero-based rank (0-11) from a 0x88 square index.
function rank(square: number): number {
  return square >> 4
}

// Extracts the zero-based file (0-10) from a 0x88 square index.
function file(square: number): number {
  return square & 0xf
}

// Converts a square index to algebraic notation (e.g., 0 -> a12, 186 -> k1).
function algebraic(square: number): Square {
  const f = file(square)
  const r = rank(square)
  if (!isSquareOnBoard(square)) {
    throw new Error(
      `Invalid square index for algebraic conversion: ${square} (f=${f}, r=${r})`,
    )
  }
  // RANKS array is '12' down to '1', so index r corresponds to RANKS[r]
  return (FILES[f] + RANKS[r]) as Square
}

function swapColor(color: Color): Color {
  return color === RED ? BLUE : RED // Updated swapColor
}

function isDigit(c: string): boolean {
  return '0123456789'.indexOf(c) !== -1
}
// --- Move Flags ---
const FLAGS: Record<string, string> = {
  NORMAL: 'n',
  CAPTURE: 'c',
  HEROIC_PROMOTION: 'h', // Flag for when a piece becomes heroic
  STAY_CAPTURE: 's', // General flag for capturing without moving
}

const BITS: Record<string, number> = {
  NORMAL: 1,
  CAPTURE: 2,
  HEROIC_PROMOTION: 4, // Example bit
  STAY_CAPTURE: 8, // General flag bit
}

// --- Move/History Types ---
// Internal representation of a move
type InternalMove = {
  color: Color
  from: number // 0x88 index
  to: number // 0x88 index (destination OR target square for stay capture)
  piece: PieceSymbol
  captured?: PieceSymbol
  // promotion?: PieceSymbol; // Promotion is status change, not piece change?
  flags: number // Bitmask using BITS
  becameHeroic?: boolean // Track if this move caused promotion
}

// Structure for storing history states
interface History {
  move: InternalMove
  kings: Record<Color, number> // Position of commander before the move
  turn: Color
  // castling: Record<Color, number>; // No castling mentioned
  // epSquare: number; // No en passant mentioned
  halfMoves: number // Half move clock before the move
  moveNumber: number // Move number before the move
  heroicStatus: Record<number, boolean> // Snapshot of heroic status before move
}

// Public Move class (similar to chess.js) - can be fleshed out later
export class Move {
  color: Color
  from: Square
  to: Square // Destination square (piece's final location)
  piece: PieceSymbol
  captured?: PieceSymbol
  // promotion?: PieceSymbol; // Not applicable?
  flags: string // String representation of flags
  san?: string // Standard Algebraic Notation (needs implementation)
  lan?: string // Long Algebraic Notation (needs implementation)
  before: string // FEN before move
  after: string // FEN after move
  heroic: boolean // Was the piece heroic *before* this move?
  becameHeroic?: boolean // Did the piece become heroic *on* this move?
  targetSquare?: Square // For stay capture, the square of the captured piece

  // Constructor needs the main class instance to generate SAN, FENs etc.
  constructor(game: CoTuLenh, internal: InternalMove, pieceWasHeroic: boolean) {
    const { color, piece, from, to, flags, captured, becameHeroic } = internal

    this.color = color
    this.piece = piece
    this.from = algebraic(from)
    this.flags = ''
    for (const flag in BITS) {
      if (BITS[flag] & flags) {
        this.flags += FLAGS[flag]
      }
    }
    if (captured) this.captured = captured
    this.heroic = pieceWasHeroic
    if (becameHeroic) this.becameHeroic = true

    // Determine 'to' square (final location) and 'targetSquare' for display/Move object
    if (flags & BITS.STAY_CAPTURE) {
      this.to = algebraic(from) // Piece stays put
      this.targetSquare = algebraic(to) // 'to' in internal move holds the target square
    } else {
      this.to = algebraic(to) // Normal move destination
    }

    // Store FEN before move
    this.before = game.fen()

    // The 'before' and 'after' FENs are set by the public move() method
    // after the move is made and the Move object is constructed.
    this.before = 'FEN_BEFORE_PLACEHOLDER' // Will be set by move()
    this.after = 'FEN_AFTER_PLACEHOLDER' // Will be set by move()

    // TODO: Implement SAN/LAN generation based on rules
    // Use targetSquare for the destination part of SAN if it's a stay capture
    const sanDestination = this.targetSquare ? this.targetSquare : this.to
    this.san = `${this.heroic ? '*' : ''}${this.piece.toUpperCase()}${this.from}${
      flags & BITS.CAPTURE ? 'x' : '-'
    }${sanDestination}${this.becameHeroic ? '*' : ''}` // Basic placeholder SAN
    this.lan = `${this.from}${sanDestination}` // Basic placeholder LAN
  }

  // Add helper methods like isCapture(), isPromotion() etc. if needed
  isCapture(): boolean {
    return this.flags.includes(FLAGS.CAPTURE)
  }

  isStayCapture(): boolean {
    return this.flags.includes(FLAGS.STAY_CAPTURE)
  }
}

// --- Piece Offsets (Initial Definitions & TODOs) ---
const ORTHOGONAL_OFFSETS = [-16, 1, 16, -1] // N, E, S, W
const DIAGONAL_OFFSETS = [-17, -15, 17, 15] // NE, NW, SE, SW
const ALL_OFFSETS = [...ORTHOGONAL_OFFSETS, ...DIAGONAL_OFFSETS]

// These offsets define the *direction* of movement. Range and blocking are handled in move generation.
const PIECE_OFFSETS: Partial<Record<PieceSymbol, number[]>> = {
  c: ALL_OFFSETS, // Commander: any direction (sliding), captures adjacent (special handling needed)
  i: ORTHOGONAL_OFFSETS, // Infantry/Engineer: 1 step orthogonal
  e: ORTHOGONAL_OFFSETS, // Engineer: 1 step orthogonal
  t: ORTHOGONAL_OFFSETS, // Tank: Up to 2 steps orthogonal (sliding with range limit)
  m: ALL_OFFSETS, // Militia: 1 step any direction
  a: ALL_OFFSETS, // Artillery: Up to 3 steps any direction (sliding with range limit), capture ignores blocking
  g: ORTHOGONAL_OFFSETS, // Anti-Air: 1 step orthogonal
  s: ALL_OFFSETS, // Missile: Complex range (2 ortho + 1 diag), capture ignores blocking (special handling)
  f: ALL_OFFSETS, // Air Force: Up to 4 steps any direction (sliding with range limit), ignores blocking
  n: ALL_OFFSETS, // Navy: Up to 4 steps move/capture, up to 3 steps capture L, terrain rules, optional stay capture
  h: [], // Headquarter: No movement
}

// --- CoTuLenh Class (Additions) ---
export class CoTuLenh {
  private _board = new Array<Piece | undefined>(256)
  private _turn: Color = RED // Default to Red
  private _header: Record<string, string> = {}
  private _kings: Record<Color, number> = { r: -1, b: -1 } // Commander positions
  // private _castling: Record<Color, number> = { r: 0, b: 0 }; // No castling
  // private _epSquare = -1; // No en passant
  private _halfMoves = 0
  private _moveNumber = 1
  private _history: History[] = []
  private _comments: Record<string, string> = {}
  private _positionCount: Record<string, number> = {}
  private _heroicStatus: Record<number, boolean> = {} // Tracks heroic status by square index

  constructor(fen = DEFAULT_POSITION) {
    this.load(fen)
  }

  clear({ preserveHeaders = false } = {}) {
    this._board = new Array<Piece | undefined>(256)
    this._kings = { r: -1, b: -1 }
    this._turn = RED
    // this._castling = { r: 0, b: 0 };
    // this._epSquare = -1;
    this._halfMoves = 0
    this._moveNumber = 1
    this._history = []
    this._comments = {}
    this._header = preserveHeaders ? this._header : {}
    this._positionCount = {}
    this._heroicStatus = {} // Clear heroic status

    delete this._header['SetUp']
    delete this._header['FEN']
  }

  // FEN loading - updated for colors, needs heroic status parsing if added to FEN
  load(fen: string, { skipValidation = false, preserveHeaders = false } = {}) {
    // TODO: Add FEN validation based on rules
    const tokens = fen.split(/\s+/)
    const position = tokens[0]

    this.clear({ preserveHeaders })

    // TODO: Parse heroic status from FEN if represented (e.g., 'C*' vs 'C')

    const ranks = position.split('/')
    if (ranks.length !== 12) {
      throw new Error(`Invalid FEN: expected 12 ranks, got ${ranks.length}`)
    }

    for (let r = 0; r < 12; r++) {
      const rankStr = ranks[r]
      let fileIndex = 0
      let currentRankSquares = 0

      for (let i = 0; i < rankStr.length; i++) {
        const char = rankStr.charAt(i)

        if (isDigit(char)) {
          // Handle multi-digit numbers for empty squares
          let numStr = char
          if (i + 1 < rankStr.length && isDigit(rankStr.charAt(i + 1))) {
            numStr += rankStr.charAt(i + 1)
            i++
          }
          const emptySquares = parseInt(numStr, 10)
          if (fileIndex + emptySquares > 11) {
            throw new Error(
              `Invalid FEN: rank ${12 - r} has too many squares (${rankStr})`,
            )
          }
          fileIndex += emptySquares
          currentRankSquares += emptySquares
        } else {
          // Handle piece character
          const color = char < 'a' ? RED : BLUE // Use RED/BLUE constants
          let type = char.toLowerCase() as PieceSymbol
          let isHeroic = false

          // TODO: Define and implement FEN representation for heroic status
          // Example: If '*' follows piece char indicates heroic
          // if (i + 1 < rankStr.length && rankStr.charAt(i+1) === '*') {
          //     isHeroic = true;
          //     i++; // Consume the '*'
          // }

          // TODO: Validate piece type is known
          // Use 'in' operator which works across ES versions
          if (!(type in PIECE_OFFSETS) && type !== HEADQUARTER) {
            console.warn(`Unknown piece type in FEN: ${type}`)
            // Decide how to handle: error or skip? Skipping for now.
            fileIndex++
            currentRankSquares++
            continue
          }

          const sq0x88 = r * 16 + fileIndex
          this._board[sq0x88] = { type, color }
          if (isHeroic) this._setHeroic(sq0x88, true)

          if (type === COMMANDER) {
            // Only track Commander now
            if (this._kings[color] === -1) {
              this._kings[color] = sq0x88
            } else {
              console.warn(`Multiple commanders found for color ${color}.`)
            }
          }

          fileIndex++
          currentRankSquares++
        }
      }
      if (currentRankSquares !== 11) {
        throw new Error(
          `Invalid FEN: rank ${
            12 - r
          } does not have 11 squares (${rankStr}, counted ${currentRankSquares})`,
        )
      }
    }

    this._turn = (tokens[1] as Color) || RED
    // No castling or EP to parse based on rules provided
    this._halfMoves = parseInt(tokens[4], 10) || 0
    this._moveNumber = parseInt(tokens[5], 10) || 1

    // TODO: _updateSetup, _incPositionCount
  }

  // FEN generation - needs heroic status representation
  fen(): string {
    let empty = 0
    let fen = ''
    for (let r = 0; r < 12; r++) {
      empty = 0
      for (let f = 0; f < 11; f++) {
        const sq = r * 16 + f
        const piece = this._board[sq]
        if (piece) {
          if (empty > 0) {
            fen += empty
            empty = 0
          }
          let char =
            piece.color === RED
              ? piece.type.toUpperCase()
              : piece.type.toLowerCase()
          // TODO: Add heroic marker if needed (e.g., char += this.isHeroic(sq) ? '*' : '')
          fen += char
        } else {
          empty++
        }
      }
      if (empty > 0) {
        fen += empty
      }
      if (r < 11) {
        fen += '/'
      }
    }

    const castling = '-' // No castling
    const epSquare = '-' // No en passant

    return [
      fen,
      this._turn,
      castling,
      epSquare,
      this._halfMoves,
      this._moveNumber,
    ].join(' ')
  }

  // --- Heroic Status ---
  isHeroic(square: Square | number): boolean {
    const sq = typeof square === 'number' ? square : SQUARE_MAP[square]
    if (sq === undefined) return false
    return !!this._heroicStatus[sq]
  }

  private _setHeroic(square: number, status: boolean) {
    if (status) {
      this._heroicStatus[square] = true
    } else {
      delete this._heroicStatus[square]
    }
  }

  // --- Get/Put/Remove (Updated for Heroic) ---
  get(square: Square): (Piece & { heroic: boolean }) | undefined {
    const sq = SQUARE_MAP[square]
    if (sq === undefined) return undefined
    const piece = this._board[sq]
    return piece ? { ...piece, heroic: this.isHeroic(sq) } : undefined
  }

  put(
    {
      type,
      color,
      heroic = false,
    }: { type: PieceSymbol; color: Color; heroic?: boolean },
    square: Square,
  ): boolean {
    if (!(square in SQUARE_MAP)) return false
    const sq = SQUARE_MAP[square]

    // Handle commander limit
    if (
      type === COMMANDER &&
      this._kings[color] !== -1 &&
      this._kings[color] !== sq
    ) {
      return false
    }

    const currentPiece = this._board[sq]
    if (
      currentPiece &&
      currentPiece.type === COMMANDER &&
      this._kings[currentPiece.color] === sq
    ) {
      this._kings[currentPiece.color] = -1
    }
    // Remove heroic status if piece is replaced
    if (this.isHeroic(sq)) {
      this._setHeroic(sq, false)
    }

    this._board[sq] = { type, color }
    if (type === COMMANDER) this._kings[color] = sq
    if (heroic) this._setHeroic(sq, true)

    // TODO: Update setup, etc.
    return true
  }

  remove(square: Square): (Piece & { heroic: boolean }) | undefined {
    if (!(square in SQUARE_MAP)) return undefined
    const sq = SQUARE_MAP[square]
    const piece = this._board[sq]
    const wasHeroic = this.isHeroic(sq)

    if (!piece) return undefined

    delete this._board[sq]
    if (wasHeroic) this._setHeroic(sq, false)

    if (piece.type === COMMANDER && this._kings[piece.color] === sq) {
      this._kings[piece.color] = -1
    }

    // TODO: Update setup, etc.
    return { ...piece, heroic: wasHeroic }
  }
  private isHeavyZone(sq: number): 0|1|2 {
    const f = file(sq);
    const r = rank(sq);
    if (f < 2) return 0;  // Not in heavy zone
    
    return r <= 5 ? 1 : 2;  // 1 = upper half, 2 = lower half
  }

  private isBridgeCrossing(from: number, to: number): boolean {
    const path = this._getPath(from, to);
    return path.some(sq => 
      sq === SQUARE_MAP.f6 || sq === SQUARE_MAP.f7 ||
      sq === SQUARE_MAP.h6 || sq === SQUARE_MAP.h7
    );
  }

  // --- Move Generation (Updated for Stay Capture Rules) ---
  private _moves({
    legal = true,
    piece = undefined,
    square = undefined,
  }: {
    legal?: boolean
    piece?: PieceSymbol
    square?: Square
  } = {}): InternalMove[] {
    const moves: InternalMove[] = []
    const us = this._turn
    const them = swapColor(us)

    let startSq = 0
    let endSq = 255 // Iterate over the whole 16x16 internal board

    if (square) {
      const sq = SQUARE_MAP[square]
      if (sq === undefined || !this._board[sq] || this._board[sq]?.color !== us)
        return []
      startSq = endSq = sq
    }

    for (let from = startSq; from <= endSq; from++) {
      if (!isSquareOnBoard(from)) continue // Skip squares not on the 11x12 board

      const pieceData = this._board[from]
      if (!pieceData || pieceData.color !== us) continue
      if (piece && pieceData.type !== piece) continue

      const pieceType = pieceData.type
      const isHero = this.isHeroic(from)
      const moveOffsets = PIECE_OFFSETS[pieceType]

      if (!moveOffsets) continue // Should not happen if all pieces are defined

      // --- Determine Movement Properties based on piece and heroic status ---
      let moveRange = 1
      let canMoveDiagonal = false
      let isSliding = false
      let captureRange = 1
      let captureIgnoresBlocking = false
      let moveIgnoresBlocking = false
      // let canCaptureStay = false; // Removed, logic handled per piece type

      // Base ranges/abilities
      switch (pieceType) {
        case COMMANDER:
          isSliding = true
          moveRange = Infinity
          captureRange = 1 // Special capture rule
          canMoveDiagonal = true
          break
        case INFANTRY:
        case ENGINEER:
        case ANTI_AIR:
        case TANK: // Tank captures like it moves
        case MILITIA:
          moveRange = 1
          captureRange = 1
          if (pieceType === TANK) {
            isSliding = true
            moveRange = 2
            captureRange = 2
          }
          if (pieceType === MILITIA) {
            canMoveDiagonal = true
          }
          break
        case ARTILLERY:
          isSliding = true
          moveRange = 3
          captureRange = 3
          captureIgnoresBlocking = true
          canMoveDiagonal = true
          break
        case MISSILE:
          isSliding = true
          moveRange = 2 // Approximation
          captureRange = 2 // Approximation
          captureIgnoresBlocking = true
          canMoveDiagonal = true
          break
        case AIR_FORCE:
          isSliding = true
          moveRange = 4
          captureRange = 4
          moveIgnoresBlocking = true // Ignores blocking for move AND capture
          canMoveDiagonal = true
          break
        case NAVY:
          isSliding = true
          moveRange = 4 // Base move range
          // Capture range depends on target (4 for Navy, 3 for L)
          canMoveDiagonal = true
          break
        case HEADQUARTER:
          moveRange = 0
          captureRange = 0
          break
      }

      // Apply Heroic bonus
      if (isHero) {
        moveRange++
        captureRange++
        canMoveDiagonal = true // All heroic pieces can move diagonally
        if (pieceType === HEADQUARTER) {
          // Heroic HQ moves like Militia
          moveRange = 1
          captureRange = 1
          isSliding = false // HQ steps, doesn't slide
        }
      }

      const currentOffsets = canMoveDiagonal ? ALL_OFFSETS : ORTHOGONAL_OFFSETS

      // --- Generate Moves based on Offsets and Rules ---
      if (pieceType === MISSILE) {
        // TODO: Implement Missile's specific movement pattern generation
        console.warn('Missile movement not fully implemented.')
      } else {
        // Standard offset iteration for other pieces
        for (const offset of currentOffsets) {
          let currentRange = 0
          let to = from

          while (true) {
            // Loop for sliding pieces or single step
            to += offset
            currentRange++

            if (!isSquareOnBoard(to)) break // Off the 11x12 board
            if (currentRange > moveRange && moveRange !== Infinity) break // Exceeded move range

            const targetPiece = this._board[to]
            const isHeavyPiece = [ARTILLERY, MISSILE, ANTI_AIR].includes(pieceType)

            // --- Movement Restrictions based on Masks and Zones ---
            if (pieceType === NAVY) {
              // Navy can only operate on NAVY_MASK squares
              if (!NAVY_MASK[to]) {
                 // Allow capture of land piece on non-navy square if within range
                 if (targetPiece && targetPiece.color === them && LAND_MASK[to] && currentRange <= (isHero ? 4 : 3)) {
                    // Capture logic handled below
                 } else {
                    break // Cannot move/exist on non-NAVY_MASK square (unless capturing L)
                 }
              }
            } else if (LAND_MASK[from]) { // Land pieces (excluding Air Force which ignores terrain)
              // Land pieces cannot enter non-LAND_MASK squares (pure water)
              if (!LAND_MASK[to]) break

              // Heavy piece river crossing rule
              if (isHeavyPiece) {
                const zoneFrom = this.isHeavyZone(from);
                const zoneTo = this.isHeavyZone(to);
                // Check if crossing between the two land halves (zone 1 and 2)
                if (zoneFrom !== 0 && zoneTo !== 0 && zoneFrom !== zoneTo) {
                  const isCaptureMove = targetPiece && targetPiece.color === them;
                  const isCrossingBridge = this.isBridgeCrossing(from, to);
                  // Must be capture OR bridge crossing to cross zones
                  if (!isCaptureMove && !isCrossingBridge) {
                    break; // Illegal zone crossing
                  }
                }
              }
            }
            // Air Force ignores all terrain/mask restrictions for movement

            // --- Target Square Analysis ---
            if (targetPiece) {
              // --- Capture Logic ---
              if (targetPiece.color === them && currentRange <= captureRange) {
                let captureAllowed = true
                let addNormalCapture = true
                let addStayCapture = false

                // Commander captures only adjacent
                if (pieceType === COMMANDER && currentRange > 1) {
                  captureAllowed = false
                }

                // Blocking check (unless ignored)
                if (
                  captureAllowed &&
                  !captureIgnoresBlocking &&
                  pieceType !== AIR_FORCE
                ) {
                  if (this._isPathBlocked(from, to, offset, true)) {
                    captureAllowed = false
                  }
                }

                if (captureAllowed) {
                  // --- Simplified Stay Capture Logic ---
                  let targetSquareIsValidForAttacker = false;

                  if (pieceType === NAVY) {
                    // Navy can only exist on NAVY_MASK squares
                    targetSquareIsValidForAttacker = NAVY_MASK[to] === 1;
                    // Apply Navy-specific capture ranges (overrides general captureRange)
                    const targetIsNavy = targetPiece.type === NAVY;
                    const navyCaptureRange = isHero ? 5 : 4;
                    const LCaptureRange = isHero ? 4 : 3;
                    if (targetIsNavy && currentRange > navyCaptureRange) captureAllowed = false;
                    if (!targetIsNavy && currentRange > LCaptureRange) captureAllowed = false; // Target is Land/Air

                  } else {
                    // All other pieces (Land, Air, Heavy) require LAND_MASK squares
                    targetSquareIsValidForAttacker = LAND_MASK[to] === 1;
                  }

                  // Determine capture type based on target square validity
                  if (captureAllowed) {
                    if (targetSquareIsValidForAttacker) {
                      // Target square is valid terrain -> Replace Capture
                      addNormalCapture = true;
                      addStayCapture = false;
                    } else {
                      // Target square is invalid terrain -> Stay Capture
                      addNormalCapture = false;
                      addStayCapture = true;
                    }
                  } else {
                      // Capture not allowed (e.g. out of range for Navy specific target)
                      addNormalCapture = false;
                      addStayCapture = false;
                  }

                  // Add moves based on flags
                  if (addNormalCapture) { // Will only be true if captureAllowed is true
                    addMove(
                      moves,
                      us,
                      from,
                      to,
                      pieceType,
                      targetPiece.type,
                      BITS.CAPTURE,
                    )
                  }
                  if (addStayCapture) {
                    // For stay capture, the 'to' field in InternalMove stores the *target* square
                    addMove(
                      moves,
                      us,
                      from,
                      to,
                      pieceType,
                      targetPiece.type,
                      BITS.CAPTURE | BITS.STAY_CAPTURE,
                    )
                  }
                }
              }
              // Blocked by own piece or blocked capture
              if (!moveIgnoresBlocking) {
                break // Path blocked for movement
              }
              // If Air Force, continue checking further squares even if blocked
            } else {
              // --- Move to Empty Square Logic ---
              // Blocking check for movement (unless ignored)
              if (!moveIgnoresBlocking) {
                if (this._isPathBlocked(from, to, offset, false)) {
                  break // Path blocked
                }
              }
              addMove(moves, us, from, to, pieceType)
            }

            // If not a sliding piece, stop after the first step
            if (!isSliding) break
          } // End while loop for sliding range
        } // End for loop over offsets
      } // End else block (non-Missile pieces)
    } // End for loop over board squares

    // TODO: Implement promotion check/flagging after generating moves
    // TODO: Implement last piece auto-promotion check

    // Filter illegal moves (leaving commander in check)
    if (!legal) return moves

    const legalMoves: InternalMove[] = []
    for (const move of moves) {
      this._makeMove(move) // Temporarily make move
      if (!this._isKingAttacked(us)) {
        legalMoves.push(move)
      }
      this._undoMove() // Undo temporary move
    }
    return legalMoves
  }

  // Helper to check if path is blocked (excluding destination square)
  private _isPathBlocked(
    from: number,
    to: number,
    offset: number,
    isCapture: boolean,
  ): boolean {
    // Air Force ignores blocking
    const pieceType: PieceSymbol | undefined = this._board[from]?.type
    if (!pieceType) return false // Should not happen
    if (pieceType === AIR_FORCE) return false;
    // Artillery and Missile ignore blocking only for capture
    if (isCapture && [ARTILLERY, MISSILE].includes(pieceType)) return false;

    let current = from + offset;
    while (current !== to) {
      if (!isSquareOnBoard(current)) return true; // Should not happen if 'to' is on board

      // Only check for blocking pieces, terrain path checks removed
      if (this._board[current]) return true; // Blocked by any piece

      current += offset;
    }
    return false
  }

  // Public moves method (formats output)
  moves({
    verbose = false,
    square = undefined,
    piece = undefined,
  }: { verbose?: boolean; square?: Square; piece?: PieceSymbol } = {}):
    | string[]
    | Move[] {
    const internalMoves = this._moves({ square, piece, legal: true }) // Generate legal moves

    if (verbose) {
      // Map to Move objects, passing current heroic status
      return internalMoves.map(
        (move) => new Move(this, move, this.isHeroic(move.from)),
      )
    } else {
      // Generate SAN strings (needs proper implementation)
      // Pass all legal moves for ambiguity resolution
      const allLegalMoves = this._moves({ legal: true })
      return internalMoves.map((move) => this._moveToSan(move, allLegalMoves))
    }
  }
  private _getPath(from: number, to: number): number[] {
    const path: number[] = [];
    const dx = file(to) - file(from);
    const dy = rank(to) - rank(from);
    const dirX = dx && (dx > 0 ? 1 : -1); // Horizontal direction
    const dirY = dy && (dy > 0 ? 1 : -1); // Vertical direction
    
    // Handle orthogonal moves
    if (dx === 0 || dy === 0) {
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      const offset = dx ? dirX : dirY * 16;
      
      for (let i = 1; i <= steps; i++) {
        const sq = from + (offset * i);
        if (isSquareOnBoard(sq)) path.push(sq);
      }
    }
    // Handle diagonal moves
    else if (Math.abs(dx) === Math.abs(dy)) {
      const offset = dirX + (dirY * 16);
      
      for (let i = 1; i <= Math.abs(dx); i++) {
        const sq = from + (offset * i);
        if (isSquareOnBoard(sq)) path.push(sq);
      }
    }
    // Handle knight-like moves (for Missile/Militia)
    else if (Math.abs(dx) + Math.abs(dy) === 3 && Math.abs(dx) !== 3) {
      // No intermediate squares for leaping pieces
      return [];
    }

    return path.filter(sq => sq !== from); // Exclude starting square
  }

  // --- Move Execution/Undo (Updated for Stay Capture) ---
  private _makeMove(move: InternalMove) {
    const us = this.turn()
    const them = swapColor(us)

    // Capture current state for history
    const historyEntry: History = {
      move,
      kings: { ...this._kings },
      turn: us,
      halfMoves: this._halfMoves,
      moveNumber: this._moveNumber,
      heroicStatus: { ...this._heroicStatus },
    }
    this._history.push(historyEntry)

    // --- Update Board ---
    const pieceToMove = this._board[move.from] // Piece being moved
    if (!pieceToMove) {
      console.error(
        'Attempting to move from empty square:',
        algebraic(move.from),
      )
      this._history.pop() // Remove invalid history entry
      return // Should not happen
    }
    const pieceWasHeroic = this.isHeroic(move.from) // Status before move

    // Handle Stay Capture vs Normal Capture/Move
    if (move.flags & BITS.STAY_CAPTURE) {
      const targetSq = move.to // 'to' stores the target square in this special case
      const capturedPiece = this._board[targetSq] // For clock reset check
      if (!capturedPiece || capturedPiece.color !== them) {
        console.error(
          'Stay capture target square is empty or has own piece:',
          algebraic(targetSq),
        )
        this._history.pop() // Remove invalid history entry
        return // Should not happen
      }
      delete this._board[targetSq]
      // Remove heroic status of captured piece
      if (this.isHeroic(targetSq)) this._setHeroic(targetSq, false)
      move.captured = capturedPiece.type // Ensure captured type is set
      // The moving piece stays at move.from, its heroic status remains unchanged (handled by history restore)
    } else {
      // Normal move/capture
      const destSq = move.to
      const capturedPiece = this._board[destSq] // Check destination for capture

      delete this._board[move.from]
      // Remove heroic status from source square (will be reapplied if needed)
      if (pieceWasHeroic) this._setHeroic(move.from, false)

      // Place piece at destination
      this._board[destSq] = pieceToMove
      // Apply heroic status if it was heroic
      if (pieceWasHeroic) this._setHeroic(destSq, true)

      // Handle captured piece
      if (move.flags & BITS.CAPTURE) {
        if (!capturedPiece || capturedPiece.color !== them) {
          console.error(
            'Normal capture destination square is empty or has own piece:',
            algebraic(destSq),
          )
          // Allow overwriting own piece? No, standard rules usually forbid.
          // Let's assume the move generation prevents this. If it happens, it's an error.
          // We might need to revert if this error occurs.
        } else {
          move.captured = capturedPiece.type // Set captured type
          // Remove heroic status of captured piece if it existed
          if (this.isHeroic(destSq) && !pieceWasHeroic) {
            // If a non-heroic piece captures a heroic piece, the heroic status is lost
            // This logic seems complex - does capturing a hero remove the capturer's hero status?
            // Assuming the captured piece's status is simply removed.
            // The capturer's status (pieceWasHeroic) is reapplied above.
            // Let's simplify: just ensure the destination square has the correct final status.
            if (!pieceWasHeroic) this._setHeroic(destSq, false) // Ensure non-heroic if capturer wasn't heroic
          }
        }
      }

      // Update commander position if moved
      if (pieceToMove.type === COMMANDER) {
        this._kings[us] = destSq
      }
    }

    // --- Update Clocks ---
    // Reset half move counter if capture or infantry/militia/engineer move (pawn-like)
    if (
      move.flags & BITS.CAPTURE ||
      pieceToMove.type === INFANTRY ||
      pieceToMove.type === MILITIA ||
      pieceToMove.type === ENGINEER
    ) {
      this._halfMoves = 0
    } else {
      this._halfMoves++
    }

    // Increment move number if Blue moved
    if (us === BLUE) {
      this._moveNumber++
    }

    // --- Handle Promotion ---
    // Check if this move grants heroic status
    let becameHeroic = false
    // Determine the square where the piece *ended up*
    const finalSq = move.flags & BITS.STAY_CAPTURE ? move.from : move.to

    // TODO: Implement check detection properly first
    // Temporarily switch turn to check opponent's king
    this._turn = them
    // if (this._isKingAttacked(them)) { // If the move puts opponent in check
    //     if (!this.isHeroic(finalSq)) { // And the piece wasn't already heroic
    //         this._setHeroic(finalSq, true);
    //         becameHeroic = true;
    //     }
    // }
    this._turn = us // Switch back for now

    // TODO: Check for last piece auto-promotion

    // Update the move object in history if promotion occurred
    if (becameHeroic) {
      move.becameHeroic = true // Modify the move object directly (part of history)
      move.flags |= BITS.HEROIC_PROMOTION
      // Ensure the board reflects the new heroic status
      this._setHeroic(finalSq, true)
    }

    // --- Switch Turn ---
    this._turn = them

    // TODO: Update position count for threefold repetition
    // this._incPositionCount(this.fen());
  }

  private _undoMove(): InternalMove | null {
    const old = this._history.pop()
    if (!old) return null

    const move = old.move
    const us = old.turn // The player who made the move being undone
    const them = swapColor(us)

    // Restore state from history entry BEFORE the move was made
    this._kings = old.kings
    this._turn = us
    this._halfMoves = old.halfMoves
    this._moveNumber = old.moveNumber
    // Restore heroic status snapshot - this is crucial
    this._heroicStatus = { ...old.heroicStatus }

    // --- Revert Board Changes ---
    const movedPieceType = move.piece

    if (move.flags & BITS.STAY_CAPTURE) {
      // Restore captured piece without moving the piece that stayed
      const targetSq = move.to // Target square is stored in 'to'
      if (move.captured) {
        this._board[targetSq] = { type: move.captured, color: them }
        // Heroic status of captured piece is restored by the snapshot restore above
      } else {
        // This case should ideally not happen for a capture flag
        delete this._board[targetSq]
      }
      // The piece at move.from was not moved, its state is restored by snapshot
    } else {
      // Revert normal move/capture
      const pieceThatMoved: Piece = { type: movedPieceType, color: us }
      this._board[move.from] = pieceThatMoved // Move piece back

      // Restore captured piece if any
      if (move.captured) {
        this._board[move.to] = { type: move.captured, color: them }
        // Heroic status of captured piece restored by snapshot
      } else {
        delete this._board[move.to] // Clear destination if it was empty
      }
      // Heroic status of the moved piece at its original square (move.from) restored by snapshot
      // Heroic status at the destination square (move.to) restored by snapshot (or cleared if empty)
    }

    // TODO: Decrement position count
    // this._decPositionCount(this.fen()); // Fen after undo

    return move
  }

  public undo(): void {
    this._undoMove()
  }

  // --- Check/Game Over Detection (Updated for Stay Capture) ---
  private _isKingAttacked(color: Color): boolean {
    const kingSq = this._kings[color]
    if (kingSq === -1) return true // Commander captured = loss = considered 'attacked' for game over

    // Generate all opponent's pseudo-legal moves
    const opponent = swapColor(color)
    const originalTurn = this._turn
    this._turn = opponent // Temporarily switch turn
    const opponentMoves = this._moves({ legal: false }) // Generate for opponent
    this._turn = originalTurn // Switch back

    for (const move of opponentMoves) {
      // Check if any move targets the king square
      // For stay capture, the target is move.to; for normal capture, it's also move.to
      if (move.flags & BITS.CAPTURE && move.to === kingSq) {
        return true // Commander is attacked
      }
    }
    return false
  }

  isCheck(): boolean {
    return this._isKingAttacked(this._turn)
  }

  isCheckmate(): boolean {
    // Checkmate = Commander is attacked AND no legal moves exist
    return this.isCheck() && this._moves({ legal: true }).length === 0
  }

  isStalemate(): boolean {
    // Stalemate = Commander is NOT attacked AND no legal moves exist
    return !this.isCheck() && this._moves({ legal: true }).length === 0
  }

  // TODO: Implement isInsufficientMaterial, isThreefoldRepetition, isDrawByFiftyMoves based on variant rules
  isDrawByFiftyMoves(): boolean {
    return this._halfMoves >= 100 // 50 moves per side
  }

  isDraw(): boolean {
    return this.isStalemate() || this.isDrawByFiftyMoves() // Add other draw conditions later (repetition, insufficient material)
  }

  isGameOver(): boolean {
    // Game over if checkmate, stalemate, draw, or commander captured
    return (
      this.isCheckmate() ||
      this.isDraw() ||
      this._kings[RED] === -1 ||
      this._kings[BLUE] === -1
    )
  }

  // --- SAN Parsing/Generation (Updated for Stay Capture) ---
  private _moveToSan(move: InternalMove, moves: InternalMove[]): string {
    // Basic placeholder, needs proper ambiguity checks, capture notation, check/mate symbols
    const pieceChar = move.piece.toUpperCase()
    const fromAlg = algebraic(move.from)
    let toAlg: string
    let capture = ''
    let stayMarker = '' // Marker for stay capture, e.g., '=' or 's'

    if (move.flags & BITS.STAY_CAPTURE) {
      toAlg = algebraic(move.to) // Target square for stay capture
      capture = 'x'
      stayMarker = '=' // Use '=' to denote stay capture in SAN? Needs confirmation.
    } else {
      toAlg = algebraic(move.to) // Destination square
      if (move.flags & BITS.CAPTURE) capture = 'x'
    }

    const heroicBefore = this._heroicStatus[move.from] // Check status *before* move for SAN
    const heroicAfter = move.becameHeroic ? '*' : '' // Check if it became heroic *on* this move

    // TODO: Add ambiguity resolution (e.g., Taf1-f3 vs Tbf1-f3)
    // Need to check if other pieces of the same type can move to the same square
    let disambiguator = ''
    // Basic ambiguity check (only file/rank if needed)
    // ... implementation needed ...

    // TODO: Add check/mate symbols (+/#) by temporarily making move and checking state

    return `${heroicBefore ? '*' : ''}${pieceChar}${disambiguator}${fromAlg}${capture}${toAlg}${stayMarker}${heroicAfter}`
  }

  private _moveFromSan(move: string, strict = false): InternalMove | null {
    // TODO: Implement robust SAN parsing based on rules and ambiguity, including stay capture marker
    console.warn('_moveFromSan not fully implemented for stay captures')
    // Very basic parsing: e.g., "Cf1-f3" or "*Cf1xf3*" or "*Nf1xf3=*" (Stay capture)
    const san = move.replace(/[+#*?!]/g, '') // Strip check/mate/heroic markers for basic parsing
    const stayCaptureMarker = '=' // Assuming '=' denotes stay capture
    const isStay = san.endsWith(stayCaptureMarker)
    const cleanSan = isStay ? san.slice(0, -1) : san

    // Regex needs update for optional disambiguator and stay marker handling
    const parts = cleanSan.match(
      // Basic: Piece, From, Capture?, To
      /^([CIITMEAGSFNH])?([a-k](?:1[0-2]|[1-9]))([x-])([a-k](?:1[0-2]|[1-9]))$/i,
    )

    if (parts) {
      const pieceType = (parts[1] || '').toLowerCase() as PieceSymbol // Infer piece if missing? Risky.
      const fromAlg = parts[2] as Square
      const separator = parts[3]
      const toAlg = parts[4] as Square // This is the target/destination square
      const isCapture = separator === 'x'

      const fromSq = SQUARE_MAP[fromAlg]
      const toSq = SQUARE_MAP[toAlg] // Target/Destination square index
      if (fromSq === undefined || toSq === undefined) return null

      // Find the matching move among legal moves
      const candidateMoves = this._moves({
        legal: true,
        square: fromAlg, // Filter by starting square
      })

      for (const m of candidateMoves) {
        // Check if piece type matches (if provided in SAN)
        if (pieceType && m.piece !== pieceType) continue

        const moveIsStay = (m.flags & BITS.STAY_CAPTURE) !== 0
        const moveIsNormalCapture =
          (m.flags & BITS.CAPTURE) !== 0 && !moveIsStay
        const moveIsNormalMove = !(m.flags & BITS.CAPTURE)

        // Match based on SAN components
        if (isStay && moveIsStay && m.to === toSq) {
          // Stay capture: SAN 'to' matches internal 'to' (target)
          return m
        } else if (
          !isStay &&
          isCapture &&
          moveIsNormalCapture &&
          m.to === toSq
        ) {
          // Normal capture: SAN 'to' matches internal 'to' (destination)
          return m
        } else if (!isStay && !isCapture && moveIsNormalMove && m.to === toSq) {
          // Normal move: SAN 'to' matches internal 'to' (destination)
          return m
        }
      }
    }
    return null // Failed to parse or find match
  }

  // Public move method using SAN or object (Updated for Stay Capture)
  move(
    move:
      | string
      | { from: string; to: string; stay?: boolean /* promotion?: string */ },
    { strict = false }: { strict?: boolean } = {},
  ): Move | null {
    let internalMove: InternalMove | null = null

    if (typeof move === 'string') {
      internalMove = this._moveFromSan(move, strict)
    } else if (typeof move === 'object') {
      const fromSq = SQUARE_MAP[move.from as Square]
      const toSq = SQUARE_MAP[move.to as Square] // Target or Destination square
      const requestedStay = move.stay === true

      if (fromSq === undefined || toSq === undefined) {
        throw new Error(
          `Invalid square in move object: ${JSON.stringify(move)}`,
        )
      }

      // Find matching move in legal moves
      const legalMoves = this._moves({
        legal: true,
        square: move.from as Square,
      })

      for (const m of legalMoves) {
        const isStayMove = (m.flags & BITS.STAY_CAPTURE) !== 0
        const targetSquareInternal = m.to // Internal 'to' is always the target/destination

        if (targetSquareInternal === toSq) {
          // Check if stay preference matches
          if (requestedStay && isStayMove) {
            internalMove = m
            break
          } else if (!requestedStay && !isStayMove) {
            internalMove = m
            break
          }
          // If stay preference doesn't match, but target is correct, keep searching
          // (e.g., Air Force might have both stay and replace options to the same target)
          // If only one option exists, we might select it even if stay preference mismatches?
          // For now, require exact match including stay flag if specified.
        }
      }
      // Fallback: If exact stay match failed, but only one move targets the square, take it?
      if (!internalMove) {
        const possibleMoves = legalMoves.filter((m) => m.to === toSq)
        if (possibleMoves.length === 1) {
          // Check if the single option is a capture if the object implies one (e.g. piece on target)
          const targetPiece = this.get(move.to as Square)
          if (targetPiece && targetPiece.color === swapColor(this.turn())) {
            if (possibleMoves[0].flags & BITS.CAPTURE) {
              internalMove = possibleMoves[0]
            }
          } else if (!targetPiece) {
            // Moving to empty square
            internalMove = possibleMoves[0]
          }
        }
      }
    }

    if (!internalMove) {
      // Try generating moves without specifying square/piece if initial parse failed (for SAN string)
      if (typeof move === 'string') {
        const allLegalMoves = this._moves({ legal: true })
        for (const m of allLegalMoves) {
          // Check if SAN matches (requires better _moveToSan)
          if (this._moveToSan(m, allLegalMoves) === move) {
            internalMove = m
            break
          }
        }
      }
      if (!internalMove) {
        // Still not found
        throw new Error(`Invalid or illegal move: ${JSON.stringify(move)}`)
      }
    }

    const pieceWasHeroic = this.isHeroic(internalMove.from) // Get status before making move
    this._makeMove(internalMove)
    // TODO: Update position count: this._incPositionCount(this.fen());

    // Create Move object *after* making the move to get correct 'after' FEN and 'becameHeroic' status
    // Need to re-fetch the move from history to get the potentially updated 'becameHeroic' flag
    const savedMove = this._history[this._history.length - 1].move
    const fenBeforeMove =
      this._history[this._history.length - 1].turn === RED &&
      this._history.length > 1
        ? new CoTuLenh(this.fen()).fen() // FEN after previous move
        : DEFAULT_POSITION // Or default if it's the first move
    // A more reliable way might be to store the FEN in the history entry itself

    const prettyMove = new Move(this, savedMove, pieceWasHeroic)

    // Manually set FENs on the prettyMove object
    prettyMove.before = fenBeforeMove // FEN before this move was made
    prettyMove.after = this.fen() // Current FEN after the move

    return prettyMove
  }

  turn(): Color {
    return this._turn
  }

  // ... (board, squareColor, history, comments, moveNumber need review/adaptation) ...
  board(): ({
    square: Square
    type: PieceSymbol
    color: Color
    heroic: boolean
  } | null)[][] {
    const output = []
    let row = []

    for (let r = 0; r < 12; r++) {
      // Iterate ranks 0-11
      row = []
      for (let f = 0; f < 11; f++) {
        // Iterate files 0-10
        const sq = r * 16 + f
        const piece = this._board[sq]
        if (piece) {
          row.push({
            square: algebraic(sq),
            type: piece.type,
            color: piece.color,
            heroic: this.isHeroic(sq),
          })
        } else {
          row.push(null)
        }
      }
      output.push(row)
    }
    return output
  }

  squareColor(square: Square): 'light' | 'dark' | null {
    if (!(square in SQUARE_MAP)) return null
    const sq = SQUARE_MAP[square]
    return (rank(sq) + file(sq)) % 2 === 0 ? 'light' : 'dark'
  }

  history({ verbose = false }: { verbose?: boolean } = {}): string[] | Move[] {
    const moveHistory: (string | Move)[] = []
    const FENHistory: string[] = [] // Store FENs to reconstruct Moves correctly
    const gameCopy = new CoTuLenh(this.fen()) // Create a copy to manipulate

    // Get FEN at the start of the actual history
    const reversedMoves: InternalMove[] = []
    while (gameCopy._history.length > 0) {
      const undoneMove = gameCopy._undoMove()
      if (undoneMove) {
        reversedMoves.push(undoneMove) // Store the undone move
      }
    }
    const startFEN = gameCopy.fen() // FEN at the beginning
    FENHistory.push(startFEN)
    reversedMoves.reverse() // Put moves back in chronological order

    // Replay moves on the copy to build history output
    // We need the original history entries for heroic status context
    for (let i = 0; i < this._history.length; i++) {
      const historyEntry = this._history[i] // Get original history entry
      const internalMove = historyEntry.move
      const pieceWasHeroic = historyEntry.heroicStatus[internalMove.from] // Status before the move

      // Make move on the copy to get state *after*
      // Use the move from the original history entry
      gameCopy._makeMove(internalMove)
      const fenAfter = gameCopy.fen()
      FENHistory.push(fenAfter) // Store FEN after the move

      if (verbose) {
        // Create Move object using the state *after* the move was made
        const moveObj = new Move(gameCopy, internalMove, pieceWasHeroic)
        // Manually set before/after FENs from our collected history
        moveObj.before = FENHistory[FENHistory.length - 2] // FEN before this move
        moveObj.after = fenAfter // FEN after this move
        moveHistory.push(moveObj)
      } else {
        // Generate SAN for the state *before* the move was made
        // Need to use the state *before* this move was made on the copy
        const tempGame = new CoTuLenh(FENHistory[FENHistory.length - 2]) // Load state before
        const movesForSAN = tempGame._moves({ legal: true }) // Get all legal moves in that state
        moveHistory.push(tempGame._moveToSan(internalMove, movesForSAN)) // Generate SAN
      }
    }

    return moveHistory as any // Cast based on verbose flag
  }

  moveNumber(): number {
    return this._moveNumber
  }

  // --- Comments ---
  getComment(): string | undefined {
    return this._comments[this.fen()]
  }
  setComment(comment: string) {
    this._comments[this.fen()] = comment
  }
  removeComment(): string | undefined {
    const comment = this._comments[this.fen()]
    delete this._comments[this.fen()];
    return comment;
  }
  // Removed printTerrainZones

  printBoard(): void {
    const ranks: { [key: number]: string[] } = {};

    // Group squares by their display rank (12 down to 1)
    for (const [alg, sq] of Object.entries(SQUARE_MAP)) {
      const displayRank = 12 - rank(sq)
      if (!ranks[displayRank]) ranks[displayRank] = []
      ranks[displayRank].push(alg)
    }

    console.log('\nCurrent Board:')

    // Print from rank 12 (top) to 1 (bottom)
    for (let dr = 12; dr >= 1; dr--) {
      let line = `${dr}`.padStart(2, ' ') + ' '
      for (const alg of ranks[dr] || []) {
        const sq = SQUARE_MAP[alg as Square];
        const piece = this._board[sq];
        const f = file(sq);
        const r = rank(sq);
        const isNavyZone = NAVY_MASK[sq] && !LAND_MASK[sq]; // Pure navy (a, b files usually)
        const isMixedZone = NAVY_MASK[sq] && LAND_MASK[sq]; // c file and river banks d6,e6,d7,e7
        const isBridge = ['f6', 'f7', 'h6', 'h7'].includes(alg);

        let bgCode = '';
        let fgCode = piece ? (piece.color === RED ? '\x1b[31m' : '\x1b[34m') : '';
        let symbol = piece ? piece.type.toUpperCase() : '·';
        if (piece && this.isHeroic(sq)) symbol = '*' + symbol;

        if (isBridge) {
          bgCode = piece ? '\x1b[45m' : '\x1b[47m'; // Magenta if piece, White if empty
        } else if (isMixedZone) {
          bgCode = '\x1b[46m'; // Cyan
        } else if (isNavyZone) {
          bgCode = '\x1b[44m'; // Blue
        }
        // Pure Land zones have no bgCode

        if (bgCode) {
          // Apply background and foreground colors
          line += `${bgCode}${fgCode}${symbol}\x1b[0m${bgCode} \x1b[0m`; // Add space with bg color
        } else {
          // No background, just foreground for piece or symbol for empty
          line += piece ? `${fgCode}${symbol}\x1b[0m ` : `${symbol} `;
        }
      }
      console.log(line);
      // Add a separator line between rank 7 (dr=7) and rank 6 (dr=6)
      if (dr === 7) {
        console.log('   -----------------------'); // Adjust length as needed
      }
    }
    console.log('   a b c d e f g h i j k');
  }

  // TODO: getComments, removeComments need pruning logic like chess.js if history is mutable
}

// Helper function to add a move to the list
// Updated for Stay Capture logic
function addMove(
  moves: InternalMove[],
  color: Color,
  from: number,
  to: number, // Destination square for normal move, Target square for stay capture
  piece: PieceSymbol,
  captured: PieceSymbol | undefined = undefined,
  flags: number = BITS.NORMAL,
) {
  // No piece promotion in this variant based on rules
  const moveToAdd: InternalMove = { color, from, to, piece, captured, flags }
  // 'to' correctly represents destination or target based on flag context in _moves
  moves.push(moveToAdd)
}
