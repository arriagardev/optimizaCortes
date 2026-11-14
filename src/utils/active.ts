import type { Board, Piece } from '../types'
import { normalizePieces } from './edges'

/** Agrega los campos nuevos a tableros guardados o importados con versiones anteriores. */
export function normalizeBoards(boards: Board[]): Board[] {
  return boards.map(b => ({ ...b, enabled: b.enabled !== false }))
}

/** Tableros que participan en la optimización (los deshabilitados se conservan). */
export function activeBoards(boards: Board[]): Board[] {
  return boards.filter(b => b.enabled !== false)
}

/** Piezas que participan en la optimización (las deshabilitadas se conservan). */
export function activePieces(pieces: Piece[]): Piece[] {
  return normalizePieces(pieces.filter(p => p.enabled !== false))
}
