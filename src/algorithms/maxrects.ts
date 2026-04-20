import type { Board, Piece, CutSolution, CutResult, PlacedPiece } from '../types'

interface FreeRect {
  x: number
  y: number
  width: number
  height: number
}

interface PieceInstance {
  pieceId: string
  label: string
  width: number
  height: number
  canRotate: boolean
}

/**
 * Maximal Rectangles bin-packing with Best Short Side Fit (BSSF) heuristic.
 *
 * After each placement the occupied zone (piece + blade kerf, clamped to board
 * boundary) is split against every existing free rectangle with a 4-way split.
 * Rectangles fully contained within another are pruned. BSSF scores a candidate
 * as min(rect.w - piece.w, rect.h - piece.h) — lower score = less short-side waste.
 */
export function maxrectsCut(
  boards: Board[],
  pieces: Piece[],
  bladeThickness = 3,
): CutSolution {
  const pieceInstances: PieceInstance[] = []
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i++) {
      pieceInstances.push({
        pieceId: piece.id,
        label: piece.label,
        width: piece.width,
        height: piece.height,
        canRotate: piece.canRotate,
      })
    }
  }
  pieceInstances.sort((a, b) => b.width * b.height - a.width * a.height)

  const results: CutResult[] = []
  const remaining = [...pieceInstances]

  for (const board of boards) {
    for (let q = 0; q < board.quantity; q++) {
      if (remaining.length === 0) break
      const { result, newRemaining } = packBoard(board, remaining, bladeThickness)
      results.push(result)
      remaining.splice(0, remaining.length, ...newRemaining)
    }
  }

  const unplacedIds = new Set(remaining.map(r => r.pieceId))
  const unplacedPieces = pieces.filter(p => unplacedIds.has(p.id))
  const totalEfficiency =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.efficiency, 0) / results.length
      : 0

  return { results, unplacedPieces, totalEfficiency, algorithmUsed: 'maxrects' }
}

function packBoard(
  board: Board,
  pieces: PieceInstance[],
  bladeThickness: number,
): { result: CutResult; newRemaining: PieceInstance[] } {
  const freeRects: FreeRect[] = [
    { x: 0, y: 0, width: board.width, height: board.height },
  ]
  const placedPieces: PlacedPiece[] = []
  const remaining = [...pieces]
  const placedIndices: number[] = []

  for (let i = 0; i < remaining.length; i++) {
    const piece = remaining[i]
    const fit = findBSSF(freeRects, piece)
    if (!fit) continue

    const pw = fit.rotated ? piece.height : piece.width
    const ph = fit.rotated ? piece.width : piece.height

    placedPieces.push({
      pieceId: piece.pieceId,
      boardId: board.id,
      x: fit.rect.x,
      y: fit.rect.y,
      width: pw,
      height: ph,
      rotated: fit.rotated,
      label: piece.label,
    })

    // Occupied zone includes kerf, clamped to board bounds
    const occW = Math.min(pw + bladeThickness, board.width - fit.rect.x)
    const occH = Math.min(ph + bladeThickness, board.height - fit.rect.y)
    splitAndPrune(freeRects, fit.rect.x, fit.rect.y, occW, occH)
    placedIndices.push(i)
  }

  const newRemaining = remaining.filter((_, i) => !placedIndices.includes(i))
  const usedArea = placedPieces.reduce((sum, p) => sum + p.width * p.height, 0)
  const totalArea = board.width * board.height

  return {
    result: {
      boardId: board.id,
      boardWidth: board.width,
      boardHeight: board.height,
      placedPieces,
      usedArea,
      totalArea,
      efficiency: totalArea > 0 ? usedArea / totalArea : 0,
    },
    newRemaining,
  }
}

function findBSSF(
  freeRects: FreeRect[],
  piece: PieceInstance,
): { rect: FreeRect; rotated: boolean } | null {
  let bestScore = Infinity
  let bestRect: FreeRect | null = null
  let bestRotated = false

  for (const rect of freeRects) {
    if (piece.width <= rect.width && piece.height <= rect.height) {
      const score = Math.min(rect.width - piece.width, rect.height - piece.height)
      if (score < bestScore) {
        bestScore = score
        bestRect = rect
        bestRotated = false
      }
    }
    if (piece.canRotate && piece.height <= rect.width && piece.width <= rect.height) {
      const score = Math.min(rect.width - piece.height, rect.height - piece.width)
      if (score < bestScore) {
        bestScore = score
        bestRect = rect
        bestRotated = true
      }
    }
  }

  return bestRect ? { rect: bestRect, rotated: bestRotated } : null
}

/**
 * 4-way split of all free rects against the occupied zone [ox,oy,ow,oh],
 * then prune any rect fully contained within another.
 */
function splitAndPrune(
  freeRects: FreeRect[],
  ox: number, oy: number, ow: number, oh: number,
): void {
  const toAdd: FreeRect[] = []
  let i = freeRects.length

  while (i--) {
    const r = freeRects[i]
    // Skip non-intersecting rects
    if (ox >= r.x + r.width || ox + ow <= r.x || oy >= r.y + r.height || oy + oh <= r.y) continue

    freeRects.splice(i, 1)

    if (ox > r.x)
      toAdd.push({ x: r.x, y: r.y, width: ox - r.x, height: r.height })
    if (ox + ow < r.x + r.width)
      toAdd.push({ x: ox + ow, y: r.y, width: r.x + r.width - (ox + ow), height: r.height })
    if (oy > r.y)
      toAdd.push({ x: r.x, y: r.y, width: r.width, height: oy - r.y })
    if (oy + oh < r.y + r.height)
      toAdd.push({ x: r.x, y: oy + oh, width: r.width, height: r.y + r.height - (oy + oh) })
  }

  for (const r of toAdd) freeRects.push(r)

  // Remove rects fully contained within another
  let j = freeRects.length
  outer: while (j--) {
    const a = freeRects[j]
    for (let k = 0; k < freeRects.length; k++) {
      if (k === j) continue
      const b = freeRects[k]
      if (b.x <= a.x && b.y <= a.y && b.x + b.width >= a.x + a.width && b.y + b.height >= a.y + a.height) {
        freeRects.splice(j, 1)
        continue outer
      }
    }
  }
}
