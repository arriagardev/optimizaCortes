import type { CutResult } from '../types'
import { splitAndPrune } from '../algorithms/maxrects'

export interface FreeArea {
  x: number
  y: number
  width: number
  height: number
  area: number
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Reconstruye las áreas libres de un tablero ya optimizado (piezas + kerf),
 * descartando las que no alcanzan `minAreaRatio` del área útil.
 * Sirve para convertir sobrantes aprovechables en tableros para el siguiente trabajo.
 */
export function findFreeAreas(
  result: CutResult,
  kerfX: number,
  kerfY: number,
  minAreaRatio = 0.02,
): FreeArea[] {
  const trim = Math.max(0, result.trim || 0)
  const usableW = result.boardWidth - trim * 2
  const usableH = result.boardHeight - trim * 2
  if (usableW <= 0 || usableH <= 0) return []

  const free: Rect[] = [{ x: trim, y: trim, width: usableW, height: usableH }]

  for (const piece of result.placedPieces) {
    const occW = Math.min(piece.width + kerfX, result.boardWidth - piece.x)
    const occH = Math.min(piece.height + kerfY, result.boardHeight - piece.y)
    splitAndPrune(free, piece.x, piece.y, occW, occH)
  }

  const minArea = result.totalArea * minAreaRatio
  const candidates = free
    .map(rect => ({ ...rect, area: rect.width * rect.height }))
    .filter(rect => rect.area >= minArea && rect.width > 0 && rect.height > 0)
    .sort((a, b) => b.area - a.area)

  // Los rectángulos maximales pueden solaparse: nos quedamos con un conjunto
  // disjunto para no ofrecer dos veces el mismo sobrante físico.
  const disjoint: FreeArea[] = []
  for (const candidate of candidates) {
    const overlaps = disjoint.some(area =>
      candidate.x < area.x + area.width &&
      candidate.x + candidate.width > area.x &&
      candidate.y < area.y + area.height &&
      candidate.y + candidate.height > area.y,
    )
    if (!overlaps) disjoint.push(candidate)
  }
  return disjoint
}
