import type { PanelCut } from '../../types'
import { cutOrientationLabel, cutReferenceEdge, numberPanelCuts } from '../../utils/cutSequence'
import { formatMeasure, formatNumber, type Unit } from '../../utils/units'

interface Props {
  steps: PanelCut[]
  unit: Unit
}

/**
 * Lista de cortes para el taller. Cada paso aplica sobre un panel concreto y la
 * medida se toma desde su borde izquierdo (corte vertical) o superior (horizontal).
 */
export function CutSequence({ steps, unit }: Props) {
  const numbered = numberPanelCuts(steps)

  return (
    <details className="cut-sequence" open>
      <summary>
        Secuencia de cortes
        <span className="cut-sequence__count">{numbered.length} pasos</span>
      </summary>
      <div className="cut-sequence__scroll">
        <ol className="cut-sequence__list">
          {numbered.map((step, index) => (
            <li key={`${step.panelId}-${index}`}>
              <span className="cut-sequence__num">{index + 1}</span>
              <span className="cut-sequence__panel" title={`Posición ${formatNumber(step.panelX)}, ${formatNumber(step.panelY)}`}>
                Panel {step.panelNo}
                <small>
                  {formatNumber(step.panelWidth)} × {formatNumber(step.panelHeight)}
                </small>
              </span>
              <span className="cut-sequence__cut">
                {cutOrientationLabel(step.orientation)} a {formatMeasure(step.offset, unit)}
                <small>largo {formatMeasure(step.length, unit)}</small>
              </span>
              <span className="cut-sequence__piece">{step.label}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="cut-sequence__hint">
        Medida desde el {cutReferenceEdge('vertical')} (corte vertical) o el {cutReferenceEdge('horizontal')} (horizontal)
        del panel. El grosor de la cuchilla ya está descontado.
      </p>
    </details>
  )
}
