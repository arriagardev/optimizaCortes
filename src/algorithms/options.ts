import type { AppSettings } from '../types'

/** Parámetros de corte que reciben ambos algoritmos. */
export interface CutOptions {
  kerfX: number
  kerfY: number
  edgeThickness: number
  pieceOrder: 'area' | 'manual'
}

export const DEFAULT_CUT_OPTIONS: CutOptions = {
  kerfX: 3,
  kerfY: 3,
  edgeThickness: 0,
  pieceOrder: 'area',
}

export function cutOptionsFromSettings(settings: AppSettings): CutOptions {
  return {
    kerfX: Math.max(0, settings.kerfX || 0),
    kerfY: Math.max(0, settings.kerfY || 0),
    edgeThickness: Math.max(0, settings.edgeThickness || 0),
    pieceOrder: settings.pieceOrder,
  }
}
