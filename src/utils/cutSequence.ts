import type { PanelCut } from '../types'

export interface CutStepView extends PanelCut {
  /** Número de panel ya normalizado (1..N) para mostrar al operador. */
  panelNo: number
}

/**
 * Numera los paneles en el orden en que aparecen en la secuencia, para que el
 * taller vea "Panel 1, Panel 2…" sin huecos. La secuencia ya viene ordenada por
 * profundidad desde el algoritmo.
 */
export function numberPanelCuts(cuts: PanelCut[]): CutStepView[] {
  const panelNumbers = new Map<number, number>()
  let next = 1

  return cuts.map(cut => {
    let panelNo = panelNumbers.get(cut.panelId)
    if (panelNo === undefined) {
      panelNo = next++
      panelNumbers.set(cut.panelId, panelNo)
    }
    return { ...cut, panelNo }
  })
}

export function cutOrientationLabel(orientation: PanelCut['orientation']): string {
  return orientation === 'vertical' ? 'Vertical' : 'Horizontal'
}

/** Borde desde el que se mide el corte. */
export function cutReferenceEdge(orientation: PanelCut['orientation']): string {
  return orientation === 'vertical' ? 'borde izquierdo' : 'borde superior'
}
