import type { Board, Piece, CutSolution, CutResult, PlacedPiece, PieceEdges, PanelCut } from '../types'
import { normalizeEdges, placedEdgeLength, rotateEdges } from '../utils/edges'

interface FreeRect {
  x: number
  y: number
  width: number
  height: number
  /** Identificador del panel dentro del tablero (para la secuencia de cortes). */
  id: number
  /** Nivel de anidamiento del panel: 0 es el tablero completo. */
  depth: number
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
  const rootId = 1
  let nextPanelId = 2
  const freeRects: FreeRect[] = [
    { x: 0, y: 0, width: board.width, height: board.height, id: rootId, depth: 0 },
  ]
  const cutSteps: PanelCut[] = []
  const placedPieces: PlacedPiece[] = []
  const remaining = [...pieces]
  const placedIndices: number[] = []

  for (let i = 0; i < remaining.length; i++) {
    const piece = remaining[i]
    const fit = findBestFit(freeRects, piece)
    if (!fit) continue

    const pw = fit.rotated ? piece.height : piece.width
    const ph = fit.rotated ? piece.width : piece.height
    const rect = fit.rect

    placedPieces.push({
      pieceId: piece.pieceId,
      boardId: board.id,
      x: rect.x,
      y: rect.y,
      width: pw,
      height: ph,
      rotated: fit.rotated,
      label: piece.label,
      edges: fit.rotated ? rotateEdges(piece.edges) : piece.edges,
    })

    const rightW = rect.width - pw - bladeThickness
    const bottomH = rect.height - ph - bladeThickness

    // Corte vertical: separa la pieza (más su cuchilla) del resto del panel.
    // El panel que queda a la izquierda conserva el alto completo.
    if (rightW > 0) {
      cutSteps.push({
        panelId: rect.id,
        panelX: rect.x,
        panelY: rect.y,
        panelWidth: rect.width,
        panelHeight: rect.height,
        orientation: 'vertical',
        offset: pw,
        length: rect.height,
        depth: rect.depth,
        label: piece.label,
      })
    }

    // Corte horizontal dentro del panel izquierdo: separa la pieza del sobrante inferior.
    if (bottomH > 0) {
      const leftPanelId = rightW > 0 ? nextPanelId++ : rect.id
      const leftPanelDepth = rightW > 0 ? rect.depth + 1 : rect.depth
      const leftPanelWidth = rightW > 0 ? pw : rect.width
      cutSteps.push({
        panelId: leftPanelId,
        panelX: rect.x,
        panelY: rect.y,
        panelWidth: leftPanelWidth,
        panelHeight: rect.height,
        orientation: 'horizontal',
        offset: ph,
        length: leftPanelWidth,
        depth: leftPanelDepth,
        label: piece.label,
      })
    }

    freeRects.splice(fit.rectIndex, 1)
    if (rightW > 0) {
      freeRects.push({
        x: rect.x + pw + bladeThickness,
        y: rect.y,
        width: rightW,
        height: rect.height,
        id: nextPanelId++,
        depth: rect.depth + 1,
      })
    }
    if (bottomH > 0) {
      freeRects.push({
        x: rect.x,
        y: rect.y + ph + bladeThickness,
        width: pw,
        height: bottomH,
        id: nextPanelId++,
        depth: rightW > 0 ? rect.depth + 2 : rect.depth + 1,
      })
    }

    placedIndices.push(i)
  }

  // La secuencia física avanza por profundidad: primero el tablero completo,
  // luego cada panel ya separado. Orden estable para que sea reproducible.
  cutSteps.sort((a, b) => a.depth - b.depth)

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
      cutSteps,
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
