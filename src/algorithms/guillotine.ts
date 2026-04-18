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
 * Guillotine bin packing algorithm (Best Area Fit heuristic).
 * Splits free rectangles using guillotine cuts after each placement.
 */
export function guillotineCut(
  boards: Board[],
  pieces: Piece[],
  bladeThickness: number = 3,
): CutSolution {
  // Expand pieces by quantity
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

  // Sort pieces largest area first
  pieceInstances.sort((a, b) => b.width * b.height - a.width * a.height)

  const results: CutResult[] = []
  const remaining = [...pieceInstances]

  for (const board of boards) {
    for (let q = 0; q < board.quantity; q++) {
      if (remaining.length === 0) break

      const boardResult = packBoard(board, remaining, bladeThickness)
      results.push(boardResult)

      // Remove placed pieces from remaining
      const placedIds = new Set(boardResult.placedPieces.map((_, i) => i))
      let idx = 0
      for (let i = remaining.length - 1; i >= 0; i--) {
        void idx
        void placedIds
      }
      // Re-derive remaining from unplaced (tracked inside packBoard)
      remaining.splice(0, remaining.length, ...boardResult._remaining)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (boardResult as any)._remaining
    }
  }

  const unplacedPieceIds = new Set(remaining.map(r => r.pieceId))
  const unplacedPieces = pieces.filter(p => unplacedPieceIds.has(p.id))

  const totalEfficiency =
    results.length > 0
      ? results.reduce((sum, r) => sum + r.efficiency, 0) / results.length
      : 0

  return { results, unplacedPieces, totalEfficiency }
}

function packBoard(
  board: Board,
  pieces: PieceInstance[],
  bladeThickness: number,
): CutResult & { _remaining: PieceInstance[] } {
  const freeRects: FreeRect[] = [
    { x: 0, y: 0, width: board.width, height: board.height },
  ]
  const placedPieces: PlacedPiece[] = []
  const remaining = [...pieces]
  const toRemove: number[] = []

  for (let i = 0; i < remaining.length; i++) {
    const piece = remaining[i]
    const fit = findBestFit(freeRects, piece, bladeThickness)

    if (fit) {
      placedPieces.push({
        pieceId: piece.pieceId,
        boardId: board.id,
        x: fit.rect.x,
        y: fit.rect.y,
        width: fit.rotated ? piece.height : piece.width,
        height: fit.rotated ? piece.width : piece.height,
        rotated: fit.rotated,
        label: piece.label,
      })
      splitFreeRect(freeRects, fit.rectIndex, fit.rotated ? piece.height : piece.width, fit.rotated ? piece.width : piece.height, bladeThickness)
      toRemove.push(i)
    }
  }

  const newRemaining = remaining.filter((_, i) => !toRemove.includes(i))

  const usedArea = placedPieces.reduce((sum, p) => sum + p.width * p.height, 0)
  const totalArea = board.width * board.height

  return {
    boardId: board.id,
    boardWidth: board.width,
    boardHeight: board.height,
    placedPieces,
    usedArea,
    totalArea,
    efficiency: totalArea > 0 ? usedArea / totalArea : 0,
    _remaining: newRemaining,
  }
}

function findBestFit(
  freeRects: FreeRect[],
  piece: PieceInstance,
  bladeThickness: number,
): { rect: FreeRect; rectIndex: number; rotated: boolean } | null {
  let bestScore = Infinity
  let bestIndex = -1
  let bestRotated = false

  for (let i = 0; i < freeRects.length; i++) {
    const rect = freeRects[i]

    // Try normal orientation
    if (piece.width + bladeThickness <= rect.width + bladeThickness && piece.height + bladeThickness <= rect.height + bladeThickness) {
      if (piece.width <= rect.width && piece.height <= rect.height) {
        const score = rect.width * rect.height - piece.width * piece.height
        if (score < bestScore) {
          bestScore = score
          bestIndex = i
          bestRotated = false
        }
      }
    }

    // Try rotated orientation
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

  // Right rectangle
  if (rightW > 0) {
    freeRects.push({
      x: rect.x + placedW + bladeThickness,
      y: rect.y,
      width: rightW,
      height: rect.height,
    })
  }

  // Bottom rectangle
  if (bottomH > 0) {
    freeRects.push({
      x: rect.x,
      y: rect.y + placedH + bladeThickness,
      width: placedW,
      height: bottomH,
    })
  }
}
