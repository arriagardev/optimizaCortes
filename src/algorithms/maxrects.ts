import type { Board, Piece, CutSolution, CutResult, PlacedPiece, PieceEdges } from '../types'
import { normalizeEdges, placedEdgeLength, rotateEdges } from '../utils/edges'
import { allowedRotations } from '../utils/grain'
import { DEFAULT_CUT_OPTIONS, type CutOptions } from './options'

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
  edges: PieceEdges
  grain: boolean
}

/**
 * Maximal Rectangles bin-packing with Best Short Side Fit (BSSF) heuristic.
 *
 * After each placement the occupied zone (piece + blade kerf, clamped to board
 * boundary) is split against every existing free rectangle with a 4-way split.
 * Rectangles fully contained within another are pruned. BSSF scores a candidate
 * as min(rect.w - piece.w, rect.h - piece.h) — lower score = less short-side waste.
 *
 * `kerfX`/`kerfY` permiten un grosor de corte distinto por eje y `board.trim`
 * descarta un margen de refile en los cuatro bordes.
 */
export function maxrectsCut(
  boards: Board[],
  pieces: Piece[],
  options: Partial<CutOptions> = {},
): CutSolution {
  const { kerfX, kerfY, edgeThickness, pieceOrder } = { ...DEFAULT_CUT_OPTIONS, ...options }

  const pieceInstances: PieceInstance[] = []
  for (const piece of pieces) {
    for (let i = 0; i < piece.quantity; i++) {
      pieceInstances.push({
        pieceId: piece.id,
        label: piece.label,
        width: piece.width,
        height: piece.height,
        canRotate: piece.canRotate,
        edges: normalizeEdges(piece.edges),
        grain: Boolean(piece.grain),
      })
    }
  }
  if (pieceOrder === 'area') {
    pieceInstances.sort((a, b) => b.width * b.height - a.width * a.height)
  }

  const results: CutResult[] = []
  const remaining = [...pieceInstances]

  for (const board of boards) {
    for (let q = 0; q < board.quantity; q++) {
      if (remaining.length === 0) break
      const { result, newRemaining } = packBoard(board, remaining, kerfX, kerfY, edgeThickness)
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
  const totalEdgeLength = results.reduce((sum, r) => sum + r.edgeLength, 0)

  return { results, unplacedPieces, totalEfficiency, totalEdgeLength, algorithmUsed: 'maxrects' }
}

function packBoard(
  board: Board,
  pieces: PieceInstance[],
  kerfX: number,
  kerfY: number,
  edgeThickness: number,
): { result: CutResult; newRemaining: PieceInstance[] } {
  const trim = Math.max(0, board.trim || 0)
  const usableW = Math.max(0, board.width - trim * 2)
  const usableH = Math.max(0, board.height - trim * 2)

  const freeRects: FreeRect[] = usableW > 0 && usableH > 0
    ? [{ x: trim, y: trim, width: usableW, height: usableH }]
    : []
  const placedPieces: PlacedPiece[] = []
  const remaining = [...pieces]
  const placedIndices: number[] = []

  for (let i = 0; i < remaining.length; i++) {
    const piece = remaining[i]
    const fit = findBSSF(freeRects, piece, board, edgeThickness)
    if (!fit) continue

    const baseW = fit.rotated ? piece.height : piece.width
    const baseH = fit.rotated ? piece.width : piece.height
    const rotEdges = fit.rotated ? rotateEdges(piece.edges) : piece.edges
    const pw = baseW - (rotEdges.left ? edgeThickness : 0) - (rotEdges.right ? edgeThickness : 0)
    const ph = baseH - (rotEdges.top ? edgeThickness : 0) - (rotEdges.bottom ? edgeThickness : 0)

    placedPieces.push({
      pieceId: piece.pieceId,
      boardId: board.id,
      x: fit.rect.x,
      y: fit.rect.y,
      width: pw,
      height: ph,
      rotated: fit.rotated,
      label: piece.label,
      step: placedPieces.length + 1,
      edges: fit.rotated ? rotateEdges(piece.edges) : piece.edges,
    })

    // Occupied zone includes kerf, clamped to board bounds
    const occW = Math.min(pw + kerfX, board.width - fit.rect.x)
    const occH = Math.min(ph + kerfY, board.height - fit.rect.y)
    splitAndPrune(freeRects, fit.rect.x, fit.rect.y, occW, occH)
    placedIndices.push(i)
  }

  const newRemaining = remaining.filter((_, i) => !placedIndices.includes(i))
  const usedArea = placedPieces.reduce((sum, p) => sum + p.width * p.height, 0)
  const totalArea = usableW * usableH

  return {
    result: {
      boardId: board.id,
      boardWidth: board.width,
      boardHeight: board.height,
      grain: board.grain,
      trim,
      placedPieces,
      usedArea,
      totalArea,
      efficiency: totalArea > 0 ? usedArea / totalArea : 0,
      edgeLength: placedPieces.reduce((sum, p) => sum + placedEdgeLength(p), 0),
    },
    newRemaining,
  }
}

function findBSSF(
  freeRects: FreeRect[],
  piece: PieceInstance,
  board: Board,
  edgeThickness: number,
): { rect: FreeRect; rotated: boolean } | null {
  let bestScore = Infinity
  let bestRect: FreeRect | null = null
  let bestRotated = false

  for (const rect of freeRects) {
    for (const rotated of allowedRotations(piece.grain, piece.canRotate, board.grain)) {
      const baseW = rotated ? piece.height : piece.width
      const baseH = rotated ? piece.width : piece.height
      const rotEdges = rotated ? rotateEdges(piece.edges) : piece.edges
      const w = baseW - (rotEdges.left ? edgeThickness : 0) - (rotEdges.right ? edgeThickness : 0)
      const h = baseH - (rotEdges.top ? edgeThickness : 0) - (rotEdges.bottom ? edgeThickness : 0)
      if (w > rect.width || h > rect.height) continue

      const score = Math.min(rect.width - w, rect.height - h)
      if (score < bestScore) {
        bestScore = score
        bestRect = rect
        bestRotated = rotated
      }
    }
  }

  return bestRect ? { rect: bestRect, rotated: bestRotated } : null
}

/**
 * 4-way split of all free rects against the occupied zone [ox,oy,ow,oh],
 * then prune any rect fully contained within another.
 */
export function splitAndPrune(
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
