import type { Board, Piece, CutSolution, CutResult, PlacedPiece, PieceEdges } from '../types'
import { normalizeEdges, placedEdgeLength, rotateEdges } from '../utils/edges'

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
}

/**
 * Guillotine bin packing algorithm (Best Area Fit heuristic).
 * Splits free rectangles using guillotine cuts after each placement.
 *
 * `pieceOrder` controls the placement priority: 'area' sorts largest first
 * (best packing quality); 'manual' respects the order of the pieces list.
 */
export function guillotineCut(
  boards: Board[],
  pieces: Piece[],
  bladeThickness = 3,
  pieceOrder: 'area' | 'manual' = 'area',
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
        edges: normalizeEdges(piece.edges),
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
      const { result, newRemaining } = packBoard(board, remaining, bladeThickness)
      results.push(result)
      remaining.splice(0, remaining.length, ...newRemaining)
    }
  }

  const unplacedPieceIds = new Set(remaining.map(r => r.pieceId))
  const unplacedPieces = pieces.filter(p => unplacedPieceIds.has(p.id))
  const totalEfficiency =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.efficiency, 0) / results.length
      : 0
  const totalEdgeLength = results.reduce((sum, r) => sum + r.edgeLength, 0)

  return { results, unplacedPieces, totalEfficiency, totalEdgeLength, algorithmUsed: 'guillotine' }
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
    const fit = findBestFit(freeRects, piece)
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
      edges: fit.rotated ? rotateEdges(piece.edges) : piece.edges,
    })
    splitFreeRect(freeRects, fit.rectIndex, pw, ph, bladeThickness)
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
      edgeLength: placedPieces.reduce((sum, p) => sum + placedEdgeLength(p), 0),
    },
    newRemaining,
  }
}

function findBestFit(
  freeRects: FreeRect[],
  piece: PieceInstance,
): { rect: FreeRect; rectIndex: number; rotated: boolean } | null {
  let bestScore = Infinity
  let bestIndex = -1
  let bestRotated = false

  for (let i = 0; i < freeRects.length; i++) {
    const rect = freeRects[i]

    if (piece.width <= rect.width && piece.height <= rect.height) {
      const score = rect.width * rect.height - piece.width * piece.height
      if (score < bestScore) {
        bestScore = score
        bestIndex = i
        bestRotated = false
      }
    }

    if (piece.canRotate && piece.height <= rect.width && piece.width <= rect.height) {
      const score = rect.width * rect.height - piece.height * piece.width
      if (score < bestScore) {
        bestScore = score
        bestIndex = i
        bestRotated = true
      }
    }
  }

  if (bestIndex === -1) return null
  return { rect: freeRects[bestIndex], rectIndex: bestIndex, rotated: bestRotated }
}

function splitFreeRect(
  freeRects: FreeRect[],
  index: number,
  placedW: number,
  placedH: number,
  bladeThickness: number,
): void {
  const rect = freeRects[index]
  freeRects.splice(index, 1)

  const rightW = rect.width - placedW - bladeThickness
  const bottomH = rect.height - placedH - bladeThickness

  if (rightW > 0)
    freeRects.push({ x: rect.x + placedW + bladeThickness, y: rect.y, width: rightW, height: rect.height })
  if (bottomH > 0)
    freeRects.push({ x: rect.x, y: rect.y + placedH + bladeThickness, width: placedW, height: bottomH })
}
