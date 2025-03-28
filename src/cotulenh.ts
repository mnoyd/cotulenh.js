/**
 * @license
 * Adapted from chess.js by Jeff Hlywa (jhlywa@gmail.com)
 * Copyright (c) 2024, Hoang Manh/cotulenh.js
 * All rights reserved.
 */

// --- Constants ---
export const RED = "r"; // Changed from WHITE
export const BLUE = "b"; // Changed from BLACK

// Piece Symbols based on user input
export const COMMANDER = "c";
export const INFANTRY = "i";
export const TANK = "t";
export const MILITIA = "m";
export const ENGINEER = "e"; // Added Engineer
export const ARTILLERY = "a";
export const ANTI_AIR = "g";
export const MISSILE = "s";
export const AIR_FORCE = "f";
export const NAVY = "n";
export const HEADQUARTER = "h";

// --- Types ---
export type Color = "r" | "b"; // Updated Color type
export type PieceSymbol = "c" | "i" | "t" | "m" | "e" | "a" | "g" | "s" | "f" | "n" | "h"; // Updated PieceSymbol

// Generate Square type for 11x12 board (a1 to k12)
const FILES = "abcdefghijk".split(""); // 11 files
const RANKS = "12,11,10,9,8,7,6,5,4,3,2,1".split(","); // 12 ranks

type SquareTuple = {
  [F in (typeof FILES)[number]]: {
    [R in (typeof RANKS)[number]]: `${F}${R}`;
  }[(typeof RANKS)[number]];
}[(typeof FILES)[number]];

export type Square = SquareTuple;

// Corrected FEN based on user input and standard additions, updated turn to RED
// NOTE: Engineer 'e' is not in this FEN. Needs clarification if it should be.
export const DEFAULT_POSITION =
  "6c4/1n2fh1hf2/3a2s2a1/2n1gt1tg2/2ie2m3i/11/11/2IE2M3I/2N1GT1TG2/3A2S2A1/1N2FH1HF2/6C4 r - - 0 1"; // Changed 'w' to 'r'

export type Piece = {
  color: Color;
  type: PieceSymbol;
};

// --- 0x88 Style Board Representation (Adapted for 16x16) ---
// We use a 16x16 board (256 squares) to fit 11x12
// Square 0 = a12, Square 1 = b12, ..., Square 10 = k12
// Square 16 = a11, ..., Square 26 = k11
// ...
// Square 176 = a1, ..., Square 186 = k1

const Ox88: Record<Square, number> = (() => {
  const map: Partial<Record<Square, number>> = {};
  for (let r = 0; r < 12; r++) {
    // 12 ranks (0-11)
    for (let f = 0; f < 11; f++) {
      // 11 files (0-10)
      const square = (FILES[f] + RANKS[r]) as Square;
      // Calculate 0x88 index: rank * 16 + file
      // Rank 0 ('12') corresponds to 0x88 rank 0
      // Rank 11 ('1') corresponds to 0x88 rank 11
      map[square] = r * 16 + f;
    }
  }
  return map as Record<Square, number>;
})();

const SQUARES: Square[] = Array.from({ length: 11 * 12 }).map((_, i) => {
  const rankIndex = Math.floor(i / 11);
  const fileIndex = i % 11;
  return (FILES[fileIndex] + RANKS[rankIndex]) as Square;
});

// --- Helper Functions ---

// Check if a square index is on the 11x12 board within the 16x16 grid
function isSquareOnBoard(sq: number): boolean {
  const r = rank(sq);
  const f = file(sq);
  return r >= 0 && r < 12 && f >= 0 && f < 11;
}

// Extracts the zero-based rank (0-11) from a 0x88 square index.
function rank(square: number): number {
  return square >> 4;
}

// Extracts the zero-based file (0-10) from a 0x88 square index.
function file(square: number): number {
  return square & 0xf;
}

// Converts a 0x88 square index to algebraic notation (e.g., 0 -> a12, 186 -> k1).
function algebraic(square: number): Square {
  const f = file(square);
  const r = rank(square);
  if (!isSquareOnBoard(square)) {
    throw new Error(
      `Invalid square index for algebraic conversion: ${square} (f=${f}, r=${r})`
    );
  }
  // RANKS array is '12' down to '1', so index r corresponds to RANKS[r]
  return (FILES[f] + RANKS[r]) as Square;
}

function swapColor(color: Color): Color {
  return color === RED ? BLUE : RED; // Updated swapColor
}

function isDigit(c: string): boolean {
  return "0123456789".indexOf(c) !== -1;
}

// --- Terrain Helpers ---
const SEA_RANKS = [0, 1, 2]; // Ranks 12, 11, 10
const COAST_RANK = 3; // Rank 9
const RIVER_BANK_FILES = [5, 6]; // Files f, g

function isSea(sq: number): boolean {
  return SEA_RANKS.includes(rank(sq));
}

function isCoast(sq: number): boolean {
  return rank(sq) === COAST_RANK;
}

function isRiverBank(sq: number): boolean {
  // Check if the square is on the board first
  return isSquareOnBoard(sq) && RIVER_BANK_FILES.includes(file(sq));
}

// Check if a move crosses the river between files 5 and 6
function isRiverCrossing(from: number, to: number): boolean {
  const f1 = file(from);
  const f2 = file(to);
  // Crossing happens if one file is < 5 and the other is >= 5
  return (
    (f1 < RIVER_BANK_FILES[0] && f2 >= RIVER_BANK_FILES[0]) ||
    (f1 >= RIVER_BANK_FILES[0] && f2 < RIVER_BANK_FILES[0])
  );
  // Note: This simplified check assumes direct orthogonal/diagonal crossing.
  // A piece moving along the bank does not "cross" the river.
}

// --- Move Flags ---
const FLAGS: Record<string, string> = {
  NORMAL: "n",
  CAPTURE: "c",
  HEROIC_PROMOTION: "h", // Flag for when a piece becomes heroic
  NAVY_STAY_CAPTURE: "s", // Flag for Navy capturing without moving
};

const BITS: Record<string, number> = {
  NORMAL: 1,
  CAPTURE: 2,
  HEROIC_PROMOTION: 4, // Example bit
  NAVY_STAY_CAPTURE: 8, // Example bit
};

// --- Move/History Types ---
// Internal representation of a move
type InternalMove = {
  color: Color;
  from: number; // 0x88 index
  to: number; // 0x88 index (or target square for Navy stay capture)
  piece: PieceSymbol;
  captured?: PieceSymbol;
  // promotion?: PieceSymbol; // Promotion is status change, not piece change?
  flags: number; // Bitmask using BITS
  becameHeroic?: boolean; // Track if this move caused promotion
};

// Structure for storing history states
interface History {
  move: InternalMove;
  kings: Record<Color, number>; // Position of commander before the move
  turn: Color;
  // castling: Record<Color, number>; // No castling mentioned
  // epSquare: number; // No en passant mentioned
  halfMoves: number; // Half move clock before the move
  moveNumber: number; // Move number before the move
  heroicStatus: Record<number, boolean>; // Snapshot of heroic status before move
}

// Public Move class (similar to chess.js) - can be fleshed out later
export class Move {
  color: Color;
  from: Square;
  to: Square; // Destination square, even for Navy stay capture
  piece: PieceSymbol;
  captured?: PieceSymbol;
  // promotion?: PieceSymbol; // Not applicable?
  flags: string; // String representation of flags
  san?: string; // Standard Algebraic Notation (needs implementation)
  lan?: string; // Long Algebraic Notation (needs implementation)
  before: string; // FEN before move
  after: string; // FEN after move
  heroic: boolean; // Was the piece heroic *before* this move?
  becameHeroic?: boolean; // Did the piece become heroic *on* this move?
  targetSquare?: Square; // For Navy stay capture, the square of the captured piece

  // Constructor needs the main class instance to generate SAN, FENs etc.
  constructor(game: CoTuLenh, internal: InternalMove, pieceWasHeroic: boolean) {
    const { color, piece, from, to, flags, captured, becameHeroic } = internal;

    this.color = color;
    this.piece = piece;
    this.from = algebraic(from);
    this.flags = "";
    for (const flag in BITS) {
      if (BITS[flag] & flags) {
        this.flags += FLAGS[flag];
      }
    }
    if (captured) this.captured = captured;
    this.heroic = pieceWasHeroic;
    if (becameHeroic) this.becameHeroic = true;

    // Determine 'to' square for display/Move object
    if (flags & BITS.NAVY_STAY_CAPTURE) {
      this.to = algebraic(from); // Navy stays put
      this.targetSquare = algebraic(to); // 'to' in internal move holds the target square
    } else {
      this.to = algebraic(to); // Normal move destination
    }

    // Store FEN before move
    this.before = game.fen();

    // The 'before' and 'after' FENs are set by the public move() method
    // after the move is made and the Move object is constructed.
    this.before = "FEN_BEFORE_PLACEHOLDER"; // Will be set by move()
    this.after = "FEN_AFTER_PLACEHOLDER"; // Will be set by move()

    // TODO: Implement SAN/LAN generation based on rules
    this.san = `${this.heroic ? "*" : ""}${this.piece}${this.from}${
      flags & BITS.CAPTURE ? "x" : "-"
    }${this.targetSquare ? this.targetSquare : this.to}${
      this.becameHeroic ? "*" : ""
    }`; // Basic placeholder SAN
    this.lan = `${this.from}${this.targetSquare ? this.targetSquare : this.to}`; // Basic placeholder LAN
  }

  // Add helper methods like isCapture(), isPromotion() etc. if needed
  isCapture(): boolean {
    return this.flags.includes(FLAGS.CAPTURE);
  }

  isNavyStayCapture(): boolean {
    return this.flags.includes(FLAGS.NAVY_STAY_CAPTURE);
  }
}

// --- Piece Offsets (Initial Definitions & TODOs) ---
const ORTHOGONAL_OFFSETS = [-16, 1, 16, -1]; // N, E, S, W
const DIAGONAL_OFFSETS = [-17, -15, 17, 15]; // NE, NW, SE, SW
const ALL_OFFSETS = [...ORTHOGONAL_OFFSETS, ...DIAGONAL_OFFSETS];

// These offsets define the *direction* of movement. Range and blocking are handled in move generation.
const PIECE_OFFSETS: Partial<Record<PieceSymbol, number[]>> = {
  c: ALL_OFFSETS, // Commander: any direction (sliding), captures adjacent (special handling needed)
  i: ORTHOGONAL_OFFSETS, // Infantry/Engineer: 1 step orthogonal
  e: ORTHOGONAL_OFFSETS, // Engineer: 1 step orthogonal
  t: ORTHOGONAL_OFFSETS, // Tank: Up to 2 steps orthogonal (sliding with range limit)
  m: DIAGONAL_OFFSETS, // Militia: 1 step diagonal
  a: ALL_OFFSETS, // Artillery: Up to 3 steps any direction (sliding with range limit), capture ignores blocking
  g: ORTHOGONAL_OFFSETS, // Anti-Air: 1 step orthogonal
  s: ALL_OFFSETS, // Missile: Complex range (2 ortho + 1 diag), capture ignores blocking (special handling)
  f: ALL_OFFSETS, // Air Force: Up to 4 steps any direction (sliding with range limit), ignores blocking
  n: ALL_OFFSETS, // Navy: Up to 4 steps move/capture, up to 3 steps capture Land, terrain rules, optional stay capture
  h: [], // Headquarter: No movement
};

// --- CoTuLenh Class (Additions) ---
export class CoTuLenh {
  private _board = new Array<Piece | undefined>(256);
  private _turn: Color = RED; // Default to Red
  private _header: Record<string, string> = {};
  private _kings: Record<Color, number> = { r: -1, b: -1 }; // Commander positions
  // private _castling: Record<Color, number> = { r: 0, b: 0 }; // No castling
  // private _epSquare = -1; // No en passant
  private _halfMoves = 0;
  private _moveNumber = 1;
  private _history: History[] = [];
  private _comments: Record<string, string> = {};
  private _positionCount: Record<string, number> = {};
  private _heroicStatus: Record<number, boolean> = {}; // Tracks heroic status by square index

  constructor(fen = DEFAULT_POSITION) {
    this.load(fen);
  }

  clear({ preserveHeaders = false } = {}) {
    this._board = new Array<Piece | undefined>(256);
    this._kings = { r: -1, b: -1 };
    this._turn = RED;
    // this._castling = { r: 0, b: 0 };
    // this._epSquare = -1;
    this._halfMoves = 0;
    this._moveNumber = 1;
    this._history = [];
    this._comments = {};
    this._header = preserveHeaders ? this._header : {};
    this._positionCount = {};
    this._heroicStatus = {}; // Clear heroic status

    delete this._header["SetUp"];
    delete this._header["FEN"];
  }

  // FEN loading - updated for colors, needs heroic status parsing if added to FEN
  load(fen: string, { skipValidation = false, preserveHeaders = false } = {}) {
    // TODO: Add FEN validation based on rules
    const tokens = fen.split(/\s+/);
    const position = tokens[0];

    this.clear({ preserveHeaders });

    // TODO: Parse heroic status from FEN if represented (e.g., 'C*' vs 'C')

    const ranks = position.split("/");
    if (ranks.length !== 12) {
      throw new Error(`Invalid FEN: expected 12 ranks, got ${ranks.length}`);
    }

    for (let r = 0; r < 12; r++) {
      const rankStr = ranks[r];
      let fileIndex = 0;
      let currentRankSquares = 0;

      for (let i = 0; i < rankStr.length; i++) {
        const char = rankStr.charAt(i);

        if (isDigit(char)) {
          // Handle multi-digit numbers for empty squares
          let numStr = char;
          if (i + 1 < rankStr.length && isDigit(rankStr.charAt(i + 1))) {
            numStr += rankStr.charAt(i + 1);
            i++;
          }
          const emptySquares = parseInt(numStr, 10);
          if (fileIndex + emptySquares > 11) {
            throw new Error(
              `Invalid FEN: rank ${12 - r} has too many squares (${rankStr})`
            );
          }
          fileIndex += emptySquares;
          currentRankSquares += emptySquares;
        } else {
          // Handle piece character
          const color = char < "a" ? RED : BLUE; // Use RED/BLUE constants
          let type = char.toLowerCase() as PieceSymbol;
          let isHeroic = false;

          // TODO: Define and implement FEN representation for heroic status
          // Example: If '*' follows piece char indicates heroic
          // if (i + 1 < rankStr.length && rankStr.charAt(i+1) === '*') {
          //     isHeroic = true;
          //     i++; // Consume the '*'
          // }

          // TODO: Validate piece type is known
          // Use 'in' operator which works across ES versions
          if (!(type in PIECE_OFFSETS) && type !== HEADQUARTER) {
            console.warn(`Unknown piece type in FEN: ${type}`);
            // Decide how to handle: error or skip? Skipping for now.
            fileIndex++;
            currentRankSquares++;
            continue;
          }

          const sq0x88 = r * 16 + fileIndex;
          this._board[sq0x88] = { type, color };
          if (isHeroic) this._setHeroic(sq0x88, true);

          if (type === COMMANDER) {
            // Only track Commander now
            if (this._kings[color] === -1) {
              this._kings[color] = sq0x88;
            } else {
              console.warn(`Multiple commanders found for color ${color}.`);
            }
          }

          fileIndex++;
          currentRankSquares++;
        }
      }
      if (currentRankSquares !== 11) {
        throw new Error(
          `Invalid FEN: rank ${
            12 - r
          } does not have 11 squares (${rankStr}, counted ${currentRankSquares})`
        );
      }
    }

    this._turn = (tokens[1] as Color) || RED;
    // No castling or EP to parse based on rules provided
    this._halfMoves = parseInt(tokens[4], 10) || 0;
    this._moveNumber = parseInt(tokens[5], 10) || 1;

    // TODO: _updateSetup, _incPositionCount
  }

  // FEN generation - needs heroic status representation
  fen(): string {
    let empty = 0;
    let fen = "";
    for (let r = 0; r < 12; r++) {
      empty = 0;
      for (let f = 0; f < 11; f++) {
        const sq = r * 16 + f;
        const piece = this._board[sq];
        if (piece) {
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          let char =
            piece.color === RED
              ? piece.type.toUpperCase()
              : piece.type.toLowerCase();
          // TODO: Add heroic marker if needed (e.g., char += this.isHeroic(sq) ? '*' : '')
          fen += char;
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        fen += empty;
      }
      if (r < 11) {
        fen += "/";
      }
    }

    const castling = "-"; // No castling
    const epSquare = "-"; // No en passant

    return [
      fen,
      this._turn,
      castling,
      epSquare,
      this._halfMoves,
      this._moveNumber,
    ].join(" ");
  }

  // --- Heroic Status ---
  isHeroic(square: Square | number): boolean {
    const sq = typeof square === "number" ? square : Ox88[square];
    if (sq === undefined) return false;
    return !!this._heroicStatus[sq];
  }

  private _setHeroic(square: number, status: boolean) {
    if (status) {
      this._heroicStatus[square] = true;
    } else {
      delete this._heroicStatus[square];
    }
  }

  // --- Get/Put/Remove (Updated for Heroic) ---
  get(square: Square): (Piece & { heroic: boolean }) | undefined {
    const sq = Ox88[square];
    if (sq === undefined) return undefined;
    const piece = this._board[sq];
    return piece ? { ...piece, heroic: this.isHeroic(sq) } : undefined;
  }

  put(
    {
      type,
      color,
      heroic = false,
    }: { type: PieceSymbol; color: Color; heroic?: boolean },
    square: Square
  ): boolean {
    if (!(square in Ox88)) return false;
    const sq = Ox88[square];

    // Handle commander limit
    if (
      type === COMMANDER &&
      this._kings[color] !== -1 &&
      this._kings[color] !== sq
    ) {
      return false;
    }

    const currentPiece = this._board[sq];
    if (
      currentPiece &&
      currentPiece.type === COMMANDER &&
      this._kings[currentPiece.color] === sq
    ) {
      this._kings[currentPiece.color] = -1;
    }
    // Remove heroic status if piece is replaced
    if (this.isHeroic(sq)) {
      this._setHeroic(sq, false);
    }

    this._board[sq] = { type, color };
    if (type === COMMANDER) this._kings[color] = sq;
    if (heroic) this._setHeroic(sq, true);

    // TODO: Update setup, etc.
    return true;
  }

  remove(square: Square): (Piece & { heroic: boolean }) | undefined {
    if (!(square in Ox88)) return undefined;
    const sq = Ox88[square];
    const piece = this._board[sq];
    const wasHeroic = this.isHeroic(sq);

    if (!piece) return undefined;

    delete this._board[sq];
    if (wasHeroic) this._setHeroic(sq, false);

    if (piece.type === COMMANDER && this._kings[piece.color] === sq) {
      this._kings[piece.color] = -1;
    }

    // TODO: Update setup, etc.
    return { ...piece, heroic: wasHeroic };
  }

  // --- Move Generation (Needs Full Implementation) ---
  private _moves({
    legal = true,
    piece = undefined,
    square = undefined,
  }: {
    legal?: boolean;
    piece?: PieceSymbol;
    square?: Square;
  } = {}): InternalMove[] {
    const moves: InternalMove[] = [];
    const us = this._turn;
    const them = swapColor(us);

    let startSq = 0;
    let endSq = 255; // Iterate over the whole 16x16 internal board

    if (square) {
      const sq = Ox88[square];
      if (sq === undefined || !this._board[sq] || this._board[sq]?.color !== us)
        return [];
      startSq = endSq = sq;
    }

    for (let from = startSq; from <= endSq; from++) {
      if (!isSquareOnBoard(from)) continue; // Skip squares not on the 11x12 board

      const pieceData = this._board[from];
      if (!pieceData || pieceData.color !== us) continue;
      if (piece && pieceData.type !== piece) continue;

      const pieceType = pieceData.type;
      const isHero = this.isHeroic(from);
      const moveOffsets = PIECE_OFFSETS[pieceType];

      if (!moveOffsets) continue; // Should not happen if all pieces are defined

      // --- Determine Movement Properties based on piece and heroic status ---
      let moveRange = 1;
      let canMoveDiagonal = false;
      let isSliding = false;
      let captureRange = 1;
      let captureIgnoresBlocking = false;
      let moveIgnoresBlocking = false;
      let canCaptureStay = false; // For Navy

      // Base ranges/abilities
      switch (pieceType) {
        case COMMANDER:
          isSliding = true;
          moveRange = Infinity;
          captureRange = 1; // Special capture rule
          canMoveDiagonal = true;
          break;
        case INFANTRY:
        case ENGINEER:
        case ANTI_AIR:
          moveRange = 1;
          captureRange = 1;
          break;
        case TANK:
          isSliding = true;
          moveRange = 2;
          captureRange = 2;
          break;
        case MILITIA:
          moveRange = 1;
          captureRange = 1;
          canMoveDiagonal = true;
          break;
        case ARTILLERY:
          isSliding = true;
          moveRange = 3;
          captureRange = 3;
          captureIgnoresBlocking = true;
          canMoveDiagonal = true;
          break;
        case MISSILE:
          // Complex range: 2 ortho + 1 diag. Needs custom logic, not simple offsets.
          // Placeholder: Treat as 2 steps any direction for now.
          isSliding = true;
          moveRange = 2;
          captureRange = 2; // Approximation
          captureIgnoresBlocking = true;
          canMoveDiagonal = true;
          break;
        case AIR_FORCE:
          isSliding = true;
          moveRange = 4;
          captureRange = 4;
          moveIgnoresBlocking = true;
          canMoveDiagonal = true; // Ignores blocking for move AND capture
          break;
        case NAVY:
          isSliding = true;
          moveRange = 4; // Base move range
          // Capture range depends on target (4 for Navy, 3 for Land)
          canCaptureStay = true; // Can capture land units without moving
          canMoveDiagonal = true;
          break;
        case HEADQUARTER:
          moveRange = 0;
          captureRange = 0;
          break;
      }

      // Apply Heroic bonus
      if (isHero) {
        moveRange++;
        captureRange++;
        canMoveDiagonal = true; // All heroic pieces can move diagonally
        if (pieceType === HEADQUARTER) {
          // Heroic HQ moves like Militia
          moveRange = 1;
          captureRange = 1;
          isSliding = false; // HQ steps, doesn't slide
        }
      }

      const currentOffsets = canMoveDiagonal ? ALL_OFFSETS : ORTHOGONAL_OFFSETS;

      // --- Generate Moves based on Offsets and Rules ---
      // Special handling for Missile range (2 ortho + 1 diag) - needs separate logic
      if (pieceType === MISSILE) {
        // TODO: Implement Missile's specific movement pattern generation
        console.warn("Missile movement not fully implemented.");
      } else {
        // Standard offset iteration for other pieces
        for (const offset of currentOffsets) {
          let currentRange = 0;
          let to = from;

          while (true) {
            // Loop for sliding pieces or single step
            to += offset;
            currentRange++;

            if (!isSquareOnBoard(to)) break; // Off the 11x12 board
            if (currentRange > moveRange && moveRange !== Infinity) break; // Exceeded move range

            // --- Terrain Checks ---
            const targetPiece = this._board[to];
            const movingToSea = isSea(to);
            const movingToCoast = isCoast(to);
            const movingToRiverBank = isRiverBank(to);
            const crossingRiver = isRiverCrossing(from, to);

            // Navy movement rules
            if (pieceType === NAVY) {
              if (!movingToSea && !movingToCoast && !movingToRiverBank) {
                // Allow capture of land piece from water/coast/bank if within range
                if (
                  targetPiece &&
                  targetPiece.color === them &&
                  currentRange <= (isHero ? 4 : 3)
                ) {
                  // Check capture blocking unless ignored (Navy capture isn't specified as ignoring blocking)
                  if (!this._isPathBlocked(from, to, offset, true)) {
                    // Add stay capture move
                    if (canCaptureStay && !isCoast(to) && !isRiverBank(to)) {
                      addMove(
                        moves,
                        us,
                        from,
                        from,
                        pieceType,
                        targetPiece.type,
                        BITS.CAPTURE | BITS.NAVY_STAY_CAPTURE,
                        to
                      );
                    }
                    // Add normal capture move (must occupy square)
                    addMove(
                      moves,
                      us,
                      from,
                      to,
                      pieceType,
                      targetPiece.type,
                      BITS.CAPTURE
                    );
                  }
                }
                break; // Cannot move further onto land
              }
              // TODO: Add rule: Navy cannot move diagonally from sea/river onto land bank?
            }
            // Land unit movement rules
            else {
              if (movingToSea) break; // Land units cannot enter sea
              // Heavy units river crossing rule
              if (
                (pieceType === ARTILLERY ||
                  (pieceType as PieceSymbol) === MISSILE ||
                  pieceType === ANTI_AIR) &&
                crossingRiver
              ) {
                // Allow if it's a capture, otherwise break
                if (
                  !targetPiece ||
                  targetPiece.color !== them ||
                  targetPiece.type === MISSILE
                ) {
                  break; // Cannot cross river without capturing
                }
                // If capturing, allow the move generation, blocking check comes later
              }
            }

            // --- Target Square Analysis ---
            if (targetPiece) {
              // --- Capture Logic ---
              if (targetPiece.color === them && currentRange <= captureRange) {
                let captureAllowed = true;
                // Commander captures only adjacent
                if (pieceType === COMMANDER && currentRange > 1) {
                  captureAllowed = false;
                }
                // Navy capture range/type check
                if (pieceType === NAVY) {
                  const targetIsNavy = targetPiece.type === NAVY;
                  const targetIsLand = !targetIsNavy;
                  const navyCaptureRange = isHero ? 5 : 4;
                  const landCaptureRange = isHero ? 4 : 3;
                  if (targetIsNavy && currentRange > navyCaptureRange)
                    captureAllowed = false;
                  if (targetIsLand && currentRange > landCaptureRange)
                    captureAllowed = false;

                  // Navy optional stay capture for land units not on coast/bank
                  if (
                    captureAllowed &&
                    targetIsLand &&
                    !isCoast(to) &&
                    !isRiverBank(to) &&
                    canCaptureStay
                  ) {
                    // Check blocking for stay capture path
                    if (!this._isPathBlocked(from, to, offset, true)) {
                      addMove(
                        moves,
                        us,
                        from,
                        from,
                        pieceType,
                        targetPiece.type,
                        BITS.CAPTURE | BITS.NAVY_STAY_CAPTURE,
                        to
                      );
                    }
                  }
                }

                // Blocking check for capture (unless ignored)
                if (
                  captureAllowed &&
                  !captureIgnoresBlocking &&
                  pieceType !== AIR_FORCE
                ) {
                  if (this._isPathBlocked(from, to, offset, true)) {
                    // Check path for capture blocking
                    captureAllowed = false;
                  }
                }

                if (captureAllowed) {
                  addMove(
                    moves,
                    us,
                    from,
                    to,
                    pieceType,
                    targetPiece.type,
                    BITS.CAPTURE
                  );
                }
              }
              // Blocked by own piece or blocked capture
              if (!moveIgnoresBlocking) {
                // Air Force ignores blocking
                break; // Path blocked for movement
              }
              // If Air Force, continue checking further squares even if blocked
            } else {
              // --- Move to Empty Square Logic ---
              // Blocking check for movement (unless ignored)
              if (!moveIgnoresBlocking) {
                if (this._isPathBlocked(from, to, offset, false)) {
                  // Check path for movement blocking
                  break; // Path blocked
                }
              }
              addMove(moves, us, from, to, pieceType);
            }

            // If not a sliding piece, stop after the first step
            if (!isSliding) break;
          } // End while loop for sliding range
        } // End for loop over offsets
      } // End else block (non-Missile pieces)
    } // End for loop over board squares

    // TODO: Implement promotion check/flagging after generating moves
    // TODO: Implement last piece auto-promotion check

    // Filter illegal moves (leaving commander in check)
    if (!legal) return moves;

    const legalMoves: InternalMove[] = [];
    for (const move of moves) {
      // Need _makeMove, _undoMove, _isKingAttacked
      this._makeMove(move); // Temporarily make move
      if (!this._isKingAttacked(us)) {
        legalMoves.push(move);
      }
      this._undoMove(); // Undo temporary move
    }
    return legalMoves;
  }

  // Helper to check if path is blocked (excluding destination square)
  private _isPathBlocked(
    from: number,
    to: number,
    offset: number,
    isCapture: boolean
  ): boolean {
    // Air Force ignores blocking
    const pieceType: PieceSymbol = this._board[from]?.type as PieceSymbol;
    if (!pieceType) return false; // Add guard for undefined pieceType
    if (pieceType === AIR_FORCE) return false;
    // Artillery and Missile ignore blocking only for capture
    if (isCapture && [ARTILLERY, MISSILE].includes(pieceType)) return false;

    let current = from + offset;
    while (current !== to) {
      if (!isSquareOnBoard(current)) return true; // Should not happen if 'to' is on board
      // TODO: Refine Navy blocking on coast?
      if (this._board[current]) return true; // Blocked by any piece
      current += offset;
    }
    return false; // Not blocked
  }

  // Public moves method (formats output)
  moves({
    verbose = false,
    square = undefined,
    piece = undefined,
  }: { verbose?: boolean; square?: Square; piece?: PieceSymbol } = {}):
    | string[]
    | Move[] {
    const internalMoves = this._moves({ square, piece, legal: true }); // Generate legal moves

    if (verbose) {
      // Map to Move objects, passing current heroic status
      return internalMoves.map(
        (move) => new Move(this, move, this.isHeroic(move.from))
      );
    } else {
      // Generate SAN strings (needs proper implementation)
      return internalMoves.map((move) => this._moveToSan(move, internalMoves));
    }
  }

  // --- Move Execution/Undo (Needs Full Implementation) ---
  private _makeMove(move: InternalMove) {
    const us = this.turn();
    const them = swapColor(us);

    // Capture current state for history
    const historyEntry: History = {
      move,
      kings: { ...this._kings },
      turn: us,
      halfMoves: this._halfMoves,
      moveNumber: this._moveNumber,
      heroicStatus: { ...this._heroicStatus },
    };
    this._history.push(historyEntry);

    // --- Update Board ---
    const pieceToMove = this._board[move.from]; // Piece being moved
    if (!pieceToMove) {
      console.error(
        "Attempting to move from empty square:",
        algebraic(move.from)
      );
      return; // Should not happen
    }
    const pieceWasHeroic = this.isHeroic(move.from); // Status before move

    // Handle Navy stay capture
    if (move.flags & BITS.NAVY_STAY_CAPTURE) {
      const targetSq = move.to; // 'to' stores the target square in this special case
      const capturedPiece = this._board[targetSq]; // For clock reset check
      delete this._board[targetSq];
      // Remove heroic status of captured piece
      if (this.isHeroic(targetSq)) this._setHeroic(targetSq, false);
      move.captured = capturedPiece?.type; // Ensure captured type is set
    } else {
      // Normal move/capture
      delete this._board[move.from];
      // Remove heroic status from source square (will be reapplied if needed)
      if (pieceWasHeroic) this._setHeroic(move.from, false);

      // Place piece at destination
      this._board[move.to] = pieceToMove;
      // Apply heroic status if it was heroic
      if (pieceWasHeroic) this._setHeroic(move.to, true);

      // Remove heroic status of captured piece if it existed
      if (move.captured && this.isHeroic(move.to) && !pieceWasHeroic) {
        // If a non-heroic piece captures a heroic piece, the heroic status is lost
        this._setHeroic(move.to, false);
      }

      // Update commander position if moved
      if (pieceToMove.type === COMMANDER) {
        this._kings[us] = move.to;
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
      this._halfMoves = 0;
    } else {
      this._halfMoves++;
    }

    // Increment move number if Blue moved
    if (us === BLUE) {
      this._moveNumber++;
    }

    // --- Handle Promotion ---
    // Check if this move grants heroic status
    let becameHeroic = false;
    const destSq = move.flags & BITS.NAVY_STAY_CAPTURE ? move.from : move.to; // Square where the piece ends up

    // TODO: Implement check detection properly first
    // Temporarily switch turn to check opponent's king
    this._turn = them;
    // if (this._isKingAttacked(them)) { // If the move puts opponent in check
    //     if (!this.isHeroic(destSq)) { // And the piece wasn't already heroic
    //         this._setHeroic(destSq, true);
    //         becameHeroic = true;
    //     }
    // }
    this._turn = us; // Switch back for now

    // TODO: Check for last piece auto-promotion

    // Update the move object in history if promotion occurred
    if (becameHeroic) {
      move.becameHeroic = true; // Modify the move object directly (part of history)
      move.flags |= BITS.HEROIC_PROMOTION;
    }

    // --- Switch Turn ---
    this._turn = them;

    // TODO: Update position count for threefold repetition
    // this._incPositionCount(this.fen());
  }

  private _undoMove(): InternalMove | null {
    const old = this._history.pop();
    if (!old) return null;

    const move = old.move;
    const us = old.turn; // The player who made the move being undone
    const them = swapColor(us);

    // Restore state from history entry BEFORE the move was made
    this._kings = old.kings;
    this._turn = us;
    this._halfMoves = old.halfMoves;
    this._moveNumber = old.moveNumber;
    this._heroicStatus = old.heroicStatus; // Restore heroic status snapshot

    // --- Revert Board Changes ---
    const movedPieceType = move.piece; // Type of the piece that moved

    if (move.flags & BITS.NAVY_STAY_CAPTURE) {
      // Restore captured piece without moving the navy
      const targetSq = move.to; // Target square is stored in 'to'
      // Ensure captured type exists before restoring
      if (move.captured) {
        this._board[targetSq] = { type: move.captured, color: them };
        // Restore heroic status if captured piece was heroic (from snapshot)
        if (old.heroicStatus[targetSq]) this._setHeroic(targetSq, true);
      } else {
        // This case should ideally not happen for a capture flag
        delete this._board[targetSq];
      }
      // Navy itself didn't move or change status, its state is restored by _heroicStatus snapshot
    } else {
      // Revert normal move/capture
      const pieceThatMoved: Piece = { type: movedPieceType, color: us };
      this._board[move.from] = pieceThatMoved; // Move piece back

      // Restore captured piece if any
      if (move.captured) {
        this._board[move.to] = { type: move.captured, color: them };
        // Restore heroic status of captured piece (from snapshot)
        if (old.heroicStatus[move.to]) this._setHeroic(move.to, true);
        else delete this._board[move.to]; // Should not happen if captured is defined
      } else {
        delete this._board[move.to]; // Clear destination if it was empty
      }

      // Restore heroic status of the moved piece (from snapshot)
      if (old.heroicStatus[move.from]) {
        this._setHeroic(move.from, true);
      } else {
        // Ensure it's not marked heroic if it wasn't before
        this._setHeroic(move.from, false);
      }
      // Clear heroic status from destination if it wasn't there before the move
      // (This is covered by restoring the snapshot)
    }

    // TODO: Decrement position count
    // this._decPositionCount(this.fen()); // Fen after undo

    return move;
  }

  // --- Check/Game Over Detection (Needs Implementation) ---
  private _isKingAttacked(color: Color): boolean {
    const kingSq = this._kings[color];
    if (kingSq === -1) return true; // Commander captured = loss = considered 'attacked' for game over

    // Generate all opponent's pseudo-legal moves
    const opponent = swapColor(color);
    const originalTurn = this._turn;
    this._turn = opponent; // Temporarily switch turn
    const opponentMoves = this._moves({ legal: false }); // Generate for opponent
    this._turn = originalTurn; // Switch back

    for (const move of opponentMoves) {
      // Check if any move targets the king square
      let targetSq = move.to;
      // Navy stay capture targets the square stored in 'to'
      if (move.flags & BITS.NAVY_STAY_CAPTURE) {
        targetSq = move.to;
      } else {
        targetSq = move.to; // Normal move target
      }

      if (targetSq === kingSq) return true; // Commander is attacked
    }
    return false;
  }

  isCheck(): boolean {
    return this._isKingAttacked(this._turn);
  }

  isCheckmate(): boolean {
    // Checkmate = Commander is attacked AND no legal moves exist
    return this.isCheck() && this._moves({ legal: true }).length === 0;
  }

  isStalemate(): boolean {
    // Stalemate = Commander is NOT attacked AND no legal moves exist
    return !this.isCheck() && this._moves({ legal: true }).length === 0;
  }

  // TODO: Implement isInsufficientMaterial, isThreefoldRepetition, isDrawByFiftyMoves based on variant rules
  isDrawByFiftyMoves(): boolean {
    return this._halfMoves >= 100; // 50 moves per side
  }

  isDraw(): boolean {
    return this.isStalemate() || this.isDrawByFiftyMoves(); // Add other draw conditions later (repetition, insufficient material)
  }

  isGameOver(): boolean {
    // Game over if checkmate, stalemate, draw, or commander captured
    return (
      this.isCheckmate() ||
      this.isDraw() ||
      this._kings[RED] === -1 ||
      this._kings[BLUE] === -1
    );
  }

  // --- SAN Parsing/Generation (Needs Implementation) ---
  private _moveToSan(move: InternalMove, moves: InternalMove[]): string {
    // Basic placeholder, needs proper ambiguity checks, capture notation, check/mate symbols
    const pieceChar = move.piece.toUpperCase();
    const fromAlg = algebraic(move.from);
    let toAlg: string;
    let capture = "";

    if (move.flags & BITS.NAVY_STAY_CAPTURE) {
      toAlg = algebraic(move.to); // Target square for Navy stay capture
      capture = "x";
    } else {
      toAlg = algebraic(move.to); // Destination square
      if (move.flags & BITS.CAPTURE) capture = "x";
    }

    const heroicBefore = this.isHeroic(move.from); // Check status *before* move for SAN
    const heroicAfter = move.becameHeroic ? "*" : ""; // Check if it became heroic *on* this move

    // TODO: Add ambiguity resolution (e.g., Taf1-f3 vs Tbf1-f3)
    // TODO: Add check/mate symbols (+/#) by temporarily making move and checking state

    return `${heroicBefore ? "*" : ""}${pieceChar}${fromAlg}${
      capture || "-"
    }${toAlg}${heroicAfter}`;
  }

  private _moveFromSan(move: string, strict = false): InternalMove | null {
    // TODO: Implement robust SAN parsing based on rules and ambiguity
    console.warn("_moveFromSan not fully implemented");
    // Very basic parsing: e.g., "Cf1-f3" or "*Cf1xf3*" or "*Nf1xs3*" (Navy stay)
    const san = move.replace(/[+#*?!]/g, ""); // Strip decorations for basic parsing
    const parts = san.match(
      /^([CIITMEAGSFNH])([a-k](?:1[0-2]|[1-9]))([x-])([a-k](?:1[0-2]|[1-9]))$/i
    );

    if (parts) {
      const pieceType = parts[1].toLowerCase() as PieceSymbol;
      const fromAlg = parts[2] as Square;
      const separator = parts[3];
      const toAlg = parts[4] as Square;
      const isCapture = separator === "x";

      const fromSq = Ox88[fromAlg];
      const toSq = Ox88[toAlg];
      if (fromSq === undefined || toSq === undefined) return null;

      // Find the matching move among legal moves
      const candidateMoves = this._moves({
        legal: true,
        piece: pieceType,
        square: fromAlg,
      });
      for (const m of candidateMoves) {
        let match = false;
        if (m.flags & BITS.NAVY_STAY_CAPTURE) {
          // Navy stay capture: 'to' in SAN matches internal 'to' (target)
          if (m.to === toSq && isCapture) match = true;
        } else {
          // Normal move: 'to' in SAN matches internal 'to' (destination)
          if (m.to === toSq) {
            // Check if capture flag matches
            if (isCapture && m.flags & BITS.CAPTURE) match = true;
            if (!isCapture && !(m.flags & BITS.CAPTURE)) match = true;
          }
        }
        if (match) {
          // Basic match found, return it. Needs ambiguity check.
          return m;
        }
      }
    }
    return null; // Failed to parse or find match
  }

  // Public move method using SAN or object
  move(
    move: string | { from: string; to: string /* promotion?: string */ },
    { strict = false }: { strict?: boolean } = {}
  ): Move | null {
    let internalMove: InternalMove | null = null;

    if (typeof move === "string") {
      internalMove = this._moveFromSan(move, strict);
    } else if (typeof move === "object") {
      const fromSq = Ox88[move.from as Square];
      const toSq = Ox88[move.to as Square];
      if (fromSq === undefined || toSq === undefined) {
        throw new Error(
          `Invalid square in move object: ${JSON.stringify(move)}`
        );
      }
      // Find matching move in legal moves
      const legalMoves = this._moves({
        legal: true,
        square: move.from as Square,
      });
      for (const m of legalMoves) {
        // Check normal move or Navy stay capture target
        const targetSquareInternal =
          m.flags & BITS.NAVY_STAY_CAPTURE ? m.to : m.to;
        if (targetSquareInternal === toSq) {
          // TODO: Check promotion match if applicable (not in this variant?)
          internalMove = m;
          break;
        }
      }
    }

    if (!internalMove) {
      // Try generating moves without specifying square/piece if initial parse failed
      if (typeof move === "string") {
        const allLegalMoves = this._moves({ legal: true });
        for (const m of allLegalMoves) {
          // Check if SAN matches (requires better _moveToSan)
          if (this._moveToSan(m, allLegalMoves) === move) {
            // Compare against generated SAN
            internalMove = m;
            break;
          }
        }
      }
      if (!internalMove) {
        // Still not found
        throw new Error(`Invalid or illegal move: ${JSON.stringify(move)}`);
      }
    }

    const pieceWasHeroic = this.isHeroic(internalMove.from); // Get status before making move
    this._makeMove(internalMove);
    // TODO: Update position count: this._incPositionCount(this.fen());

    // Create Move object *after* making the move to get correct 'after' FEN and 'becameHeroic' status
    // We need to pass the original internalMove and the pre-move heroic status
    // Need to re-fetch the move from history to get the potentially updated 'becameHeroic' flag
    const savedMove = this._history[this._history.length - 1].move;
    const prettyMove = new Move(this, savedMove, pieceWasHeroic);

    return prettyMove;
  }

  turn(): Color {
    return this._turn;
  }

  // ... (board, squareColor, history, comments, moveNumber need review/adaptation) ...
  board(): ({
    square: Square;
    type: PieceSymbol;
    color: Color;
    heroic: boolean;
  } | null)[][] {
    const output = [];
    let row = [];

    for (let r = 0; r < 12; r++) {
      // Iterate ranks 0-11
      row = [];
      for (let f = 0; f < 11; f++) {
        // Iterate files 0-10
        const sq = r * 16 + f;
        const piece = this._board[sq];
        if (piece) {
          row.push({
            square: algebraic(sq),
            type: piece.type,
            color: piece.color,
            heroic: this.isHeroic(sq),
          });
        } else {
          row.push(null);
        }
      }
      output.push(row);
    }
    return output;
  }

  squareColor(square: Square): "light" | "dark" | null {
    if (!(square in Ox88)) return null;
    const sq = Ox88[square];
    return (rank(sq) + file(sq)) % 2 === 0 ? "light" : "dark";
  }

  history({ verbose = false }: { verbose?: boolean } = {}): string[] | Move[] {
    const moveHistory: (string | Move)[] = [];
    const FENHistory: string[] = []; // Store FENs to reconstruct Moves correctly
    const initialFEN = this.fen(); // Store current FEN

    // Temporarily undo all moves to get to the start
    const reversedHistory: History[] = [];
    while (this._history.length > 0) {
      reversedHistory.push(this._history.pop()!); // Pop and store entry
    }
    // Now the board is in the initial state of the game (or load state)
    const startFEN = this.fen(); // FEN at the beginning of history
    FENHistory.push(startFEN);

    // Replay moves to build history output
    while (reversedHistory.length > 0) {
      const historyEntry = reversedHistory.pop()!; // Get history entry in order
      const internalMove = historyEntry.move;
      const pieceWasHeroic = historyEntry.heroicStatus[internalMove.from]; // Status before the move

      // Temporarily make the move to generate SAN/Move object for the state *after* this move
      this._makeMove(internalMove);
      const fenAfter = this.fen();
      FENHistory.push(fenAfter); // Store FEN after the move

      if (verbose) {
        // Create Move object using the state *after* the move was made
        // Pass the status *before* the move was made
        const moveObj = new Move(this, internalMove, pieceWasHeroic);
        // Manually set before/after FENs from our collected history
        moveObj.before = FENHistory[FENHistory.length - 2]; // FEN before this move
        moveObj.after = fenAfter; // FEN after this move
        moveHistory.push(moveObj);
      } else {
        // Generate SAN for the state *before* the move was made
        // Need to undo, generate SAN, then redo
        this._undoMove(); // Go back to state before the move
        // Need opponent moves for ambiguity check in _moveToSan
        const prevTurn = this._turn;
        this._turn = swapColor(prevTurn); // Get opponent moves for the state before
        const opponentMoves = this._moves({ legal: false });
        this._turn = prevTurn; // Restore turn
        moveHistory.push(this._moveToSan(internalMove, opponentMoves)); // Generate SAN
        this._makeMove(internalMove); // Redo the move
      }
    }

    // Restore the board to the state it was in before calling history()
    // This requires undoing all the moves we just replayed
    while (this._history.length > 0) {
      this._undoMove();
    }
    // And potentially reloading the initial FEN if history was empty
    if (typeof initialFEN === "string" && this.fen() !== initialFEN) {
      this.load(initialFEN); // Ensure we are back to the exact start state
    }

    return moveHistory as any; // Cast based on verbose flag
  }

  moveNumber(): number {
    return this._moveNumber;
  }

  // --- Comments ---
  getComment(): string | undefined {
    return this._comments[this.fen()];
  }
  setComment(comment: string) {
    this._comments[this.fen()] = comment;
  }
  removeComment(): string | undefined {
    const comment = this._comments[this.fen()];
    delete this._comments[this.fen()];
    return comment;
  }
  // TODO: getComments, removeComments need pruning logic like chess.js if history is mutable
}

// Helper function to add a move to the list
// Added targetSquare parameter for Navy stay capture
function addMove(
  moves: InternalMove[],
  color: Color,
  from: number,
  to: number, // Destination square, or 'from' square for Navy stay capture
  piece: PieceSymbol,
  captured: PieceSymbol | undefined = undefined,
  flags: number = BITS.NORMAL,
  targetSquare?: number // Optional: Actual target square for Navy stay capture
) {
  // No piece promotion in this variant based on rules
  let moveToAdd: InternalMove = { color, from, to, piece, captured, flags };
  if (flags & BITS.NAVY_STAY_CAPTURE && targetSquare !== undefined) {
    // For Navy stay capture, 'to' in the InternalMove should store the target square
    moveToAdd.to = targetSquare;
  }
  moves.push(moveToAdd);
}
