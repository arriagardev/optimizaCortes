import type { EdgeSide, Piece, PieceEdges, PlacedPiece } from '../types'

export const EDGE_SIDES: EdgeSide[] = ['top', 'right', 'bottom', 'left']

export const EDGE_LABEL: Record<EdgeSide, string> = {
  top: 'Superior',
  right: 'Derecho',
  bottom: 'Inferior',
  left: 'Izquierdo',
}

export const EDGE_SHORT: Record<EdgeSide, string> = {
  top: 'Sup',
  right: 'Der',
  bottom: 'Inf',
  left: 'Izq',
}

export const NO_EDGES: PieceEdges = { top: false, right: false, bottom: false, left: false }

/** Garantiza un objeto de cantos completo (datos viejos o importados pueden no tenerlo). */
export function normalizeEdges(edges?: Partial<PieceEdges> | null): PieceEdges {
  return {
    top: Boolean(edges?.top),
    right: Boolean(edges?.right),
    bottom: Boolean(edges?.bottom),
    left: Boolean(edges?.left),
  }
}

/** Normaliza las piezas cargadas de localStorage o de un JSON, agregando campos nuevos. */
export function normalizePieces(pieces: Piece[]): Piece[] {
  return pieces.map(p => ({ ...p, edges: normalizeEdges(p.edges) }))
}

export function hasEdges(edges?: Partial<PieceEdges> | null): boolean {
  return Boolean(edges && (edges.top || edges.right || edges.bottom || edges.left))
}

export function countEdges(edges: PieceEdges): number {
  return EDGE_SIDES.reduce((n, side) => n + (edges[side] ? 1 : 0), 0)
}

export function edgesSignature(edges: PieceEdges): string {
  return EDGE_SIDES.filter(side => edges[side]).join('-')
}

export function edgesFromSignature(signature: string): PieceEdges {
  const set = new Set(signature.split('-'))
  return {
    top: set.has('top'),
    right: set.has('right'),
    bottom: set.has('bottom'),
    left: set.has('left'),
  }
}

/**
 * Al girar una pieza 90° en sentido horario sus cantos cambian de lado:
 * sup → der, der → inf, inf → izq, izq → sup.
 * Las longitudes se conservan, así que el total de canto no cambia.
 */
export function rotateEdges(edges: PieceEdges): PieceEdges {
  return {
    top: edges.left,
    right: edges.top,
    bottom: edges.right,
    left: edges.bottom,
  }
}

/** Longitud de canto de una pieza sin colocar (sup/inf miden ancho; izq/der miden alto). */
export function pieceEdgeLength(piece: Piece): number {
  const edges = normalizeEdges(piece.edges)
  return (edges.top ? piece.width : 0)
    + (edges.bottom ? piece.width : 0)
    + (edges.left ? piece.height : 0)
    + (edges.right ? piece.height : 0)
}

/** Longitud de canto de una pieza ya colocada (usa sus dimensiones reales en el tablero). */
export function placedEdgeLength(placed: PlacedPiece): number {
  const edges = normalizeEdges(placed.edges)
  return (edges.top ? placed.width : 0)
    + (edges.bottom ? placed.width : 0)
    + (edges.left ? placed.height : 0)
    + (edges.right ? placed.height : 0)
}

/** Etiqueta corta de los lados con canto, ej. "Sup · Der". Devuelve '—' si no tiene. */
export function edgesLabel(edges?: Partial<PieceEdges> | null): string {
  const normalized = normalizeEdges(edges)
  const sides = EDGE_SIDES.filter(side => normalized[side]).map(side => EDGE_SHORT[side])
  return sides.length > 0 ? sides.join(' · ') : '—'
}

export interface EdgeBandRow {
  pieceId: string
  label: string
  edges: PieceEdges
  placedCount: number
  requestedCount: number
  length: number
}

/**
 * Agrupa el canto consumido por pieza del catálogo (no por instancia), de modo que
 * el reporte muestre los lados tal como los configuró el usuario.
 */
export function summarizeEdgeBanding(pieces: Piece[], placed: PlacedPiece[]): EdgeBandRow[] {
  const byId = new Map(pieces.map(p => [p.id, p]))
  const rows = new Map<string, EdgeBandRow>()

  for (const instance of placed) {
    if (!hasEdges(instance.edges)) continue
    const piece = byId.get(instance.pieceId)
    if (!piece) continue
    const current = rows.get(piece.id) ?? {
      pieceId: piece.id,
      label: piece.label,
      edges: normalizeEdges(piece.edges),
      placedCount: 0,
      requestedCount: piece.quantity,
      length: 0,
    }
    current.placedCount += 1
    current.length += placedEdgeLength(instance)
    rows.set(piece.id, current)
  }

  return [...rows.values()].sort((a, b) => b.length - a.length)
}

/** Cantidad de piezas que quedaron sin colocar, por pieza del catálogo. */
export function unplacedSummary(pieces: Piece[], placed: PlacedPiece[]) {
  const placedCount = new Map<string, number>()
  for (const p of placed) placedCount.set(p.pieceId, (placedCount.get(p.pieceId) ?? 0) + 1)

  return pieces
    .map(piece => {
      const placedQty = placedCount.get(piece.id) ?? 0
      return { piece, placedQty, missing: Math.max(0, piece.quantity - placedQty) }
    })
    .filter(row => row.missing > 0)
}
