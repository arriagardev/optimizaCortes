export const PIECE_COLORS: string[] = [
  '#4E9AF1', '#F1A94E', '#E45C55', '#5CB85C', '#9B59B6',
  '#1ABC9C', '#F39C12', '#2980B9', '#E74C3C', '#27AE60',
]

export const PIECE_COLORS_RGB: [number, number, number][] = [
  [78, 154, 241],
  [241, 169, 78],
  [228, 92, 85],
  [92, 184, 92],
  [155, 89, 182],
  [26, 188, 156],
  [243, 156, 18],
  [41, 128, 185],
  [231, 76, 60],
  [39, 174, 96],
]

/** Rotation-invariant color index: same color for (w×h) and (h×w). */
function pieceColorIndex(width: number, height: number): number {
  const a = Math.min(width, height)
  const b = Math.max(width, height)
  const hash = (a * 73856093) ^ (b * 19349663)
  return Math.abs(hash) % PIECE_COLORS.length
}

/** Returns the hex color for a given piece size. */
export function getPieceColor(width: number, height: number): string {
  return PIECE_COLORS[pieceColorIndex(width, height)]
}

/** Returns the RGB tuple for use in jsPDF. */
export function getPieceColorRgb(width: number, height: number): [number, number, number] {
  return PIECE_COLORS_RGB[pieceColorIndex(width, height)]
}
