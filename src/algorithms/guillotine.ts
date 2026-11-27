import type { Board, Piece, CutSolution, CutResult, PlacedPiece, PieceEdges, PanelCut } from '../types'
import { normalizeEdges, placedEdgeLength, rotateEdges } from '../utils/edges'
import { allowedRotations } from '../utils/grain'
import { DEFAULT_CUT_OPTIONS, type CutOptions } from './options'

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
  grain: boolean
}

/**
 * Guillotine bin packing algorithm (Best Area Fit heuristic).
 * Splits free rectangles using guillotine cuts after each placement.
 *
 * `kerfX`/`kerfY` permiten un grosor de corte distinto en cada eje (sierra
 * escuadradora vs. vertical). `board.trim` descarta un margen en los cuatro
 * bordes antes de acomodar piezas (refile).
 */
export function guillotineCut(
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
  kerfX: number,
  kerfY: number,
  edgeThickness: number,
): { result: CutResult; newRemaining: PieceInstance[] } {
  const trim = Math.max(0, board.trim || 0)
  const usableW = Math.max(0, board.width - trim * 2)
  const usableH = Math.max(0, board.height - trim * 2)

  const rootId = 1
  let nextPanelId = 2
  const freeRects: FreeRect[] = usableW > 0 && usableH > 0
    ? [{ x: trim, y: trim, width: usableW, height: usableH, id: rootId, depth: 0 }]
    : []
  const cutSteps: PanelCut[] = []
  const placedPieces: PlacedPiece[] = []
  const remaining = [...pieces]
  const placedIndices: number[] = []

  for (let i = 0; i < remaining.length; i++) {
    const piece = remaining[i]
    const fit = findBestFit(freeRects, piece, board, edgeThickness)
    if (!fit) continue

    const baseW = fit.rotated ? piece.height : piece.width
    const baseH = fit.rotated ? piece.width : piece.height
    const rotEdges = fit.rotated ? rotateEdges(piece.edges) : piece.edges
    const pw = baseW - (rotEdges.left ? edgeThickness : 0) - (rotEdges.right ? edgeThickness : 0)
    const ph = baseH - (rotEdges.top ? edgeThickness : 0) - (rotEdges.bottom ? edgeThickness : 0)
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
      step: placedPieces.length + 1,
      edges: fit.rotated ? rotateEdges(piece.edges) : piece.edges,
    })

    const rightW = rect.width - pw - kerfX
    const bottomH = rect.height - ph - kerfY

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
        x: rect.x + pw + kerfX,
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
        y: rect.y + ph + kerfY,
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
      cutSteps,
    },
    newRemaining,
  }
}

function findBestFit(
  freeRects: FreeRect[],
  piece: PieceInstance,
  board: Board,
  edgeThickness: number,
): { rect: FreeRect; rectIndex: number; rotated: boolean } | null {
  let bestScore = Infinity
  let bestIndex = -1
  let bestRotated = false

  for (let i = 0; i < freeRects.length; i++) {
    const rect = freeRects[i]

    for (const rotated of allowedRotations(piece.grain, piece.canRotate, board.grain)) {
      const baseW = rotated ? piece.height : piece.width
      const baseH = rotated ? piece.width : piece.height
      const rotEdges = rotated ? rotateEdges(piece.edges) : piece.edges
      const w = baseW - (rotEdges.left ? edgeThickness : 0) - (rotEdges.right ? edgeThickness : 0)
      const h = baseH - (rotEdges.top ? edgeThickness : 0) - (rotEdges.bottom ? edgeThickness : 0)
      if (w > rect.width || h > rect.height) continue

      const score = rect.width * rect.height - w * h
      if (score < bestScore) {
        bestScore = score
        bestIndex = i
        bestRotated = rotated
      }
    }
  }

  if (bestIndex === -1) return null
  return { rect: freeRects[bestIndex], rectIndex: bestIndex, rotated: bestRotated }
}
