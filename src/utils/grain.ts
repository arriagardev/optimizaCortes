import type { GrainDirection } from '../types'

export const GRAIN_LABEL: Record<GrainDirection, string> = {
  none: 'Sin veta',
  width: 'Veta horizontal',
  height: 'Veta vertical',
}

/** Símbolo corto para listas y tablas: ↔ veta a lo ancho, ↕ veta a lo alto. */
export const GRAIN_SHORT: Record<GrainDirection, string> = {
  none: '—',
  width: '↔',
  height: '↕',
}

export function normalizeGrain(grain?: GrainDirection | null): GrainDirection {
  return grain === 'width' || grain === 'height' ? grain : 'none'
}

/**
 * Orientaciones permitidas para una pieza en un tablero.
 * Devuelve si debe girarse 90°. Cuando la pieza exige veta y el tablero tiene
 * veta, la orientación es obligatoria; `canRotate` solo aplica sin restricción.
 */
export function allowedRotations(
  requiresGrain: boolean,
  canRotate: boolean,
  boardGrain: GrainDirection,
): boolean[] {
  if (requiresGrain && boardGrain !== 'none') {
    // La veta de la pieza debe correr igual que la del tablero.
    return [boardGrain === 'height']
  }
  return canRotate ? [false, true] : [false]
}
