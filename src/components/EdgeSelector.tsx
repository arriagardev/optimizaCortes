import type { EdgeSide, PieceEdges } from '../types'
import { EDGE_LABEL, EDGE_SHORT } from '../utils/edges'

interface Props {
  value: PieceEdges
  onChange: (edges: PieceEdges) => void
  /** Dimensiones de la pieza, para dibujar el panel con su proporción real. */
  width?: number
  height?: number
  compact?: boolean
}

/**
 * Selector visual de cantos: un rectángulo con los cuatro lados clicables.
 * El estado se guarda en la orientación propia de la pieza (sin rotar).
 */
export function EdgeSelector({ value, onChange, width = 300, height = 200, compact = false }: Props) {
  const safeW = width > 0 ? width : 300
  const safeH = height > 0 ? height : 200
  const ratio = safeW / safeH

  const maxW = compact ? 60 : 116
  const maxH = compact ? 40 : 76
  const panelW = ratio >= 1 ? maxW : Math.max(16, maxH * ratio)
  const panelH = ratio >= 1 ? Math.max(16, maxW / ratio) : maxH

  function toggle(side: EdgeSide) {
    onChange({ ...value, [side]: !value[side] })
  }

  const sides: { side: EdgeSide; area: string }[] = [
    { side: 'top', area: 'top' },
    { side: 'left', area: 'left' },
    { side: 'right', area: 'right' },
    { side: 'bottom', area: 'bottom' },
  ]

  return (
    <div
      className={`edge-picker${compact ? ' edge-picker--compact' : ''}`}
      role="group"
      aria-label="Lados con canto"
    >
      {sides.map(({ side, area }) => (
        <button
          key={side}
          type="button"
          className={`edge-picker__side${value[side] ? ' on' : ''}`}
          style={{ gridArea: area }}
          aria-pressed={value[side]}
          title={`Canto ${EDGE_LABEL[side].toLowerCase()}`}
          onClick={() => toggle(side)}
        >
          {EDGE_SHORT[side]}
        </button>
      ))}
      <div
        className="edge-picker__panel"
        style={{ gridArea: 'panel', width: panelW, height: panelH }}
        aria-hidden="true"
      >
        <span className="edge-picker__dims">
          {safeW} × {safeH}
        </span>
      </div>
    </div>
  )
}

export function EdgePresets({ value, onChange }: { value: PieceEdges; onChange: (e: PieceEdges) => void }) {
  return (
    <div className="edge-presets">
      <button type="button" onClick={() => onChange({ top: true, right: true, bottom: true, left: true })}>
        Todos
      </button>
      <button type="button" onClick={() => onChange({ top: false, right: false, bottom: false, left: false })}>
        Ninguno
      </button>
      <button
        type="button"
        title="Cantos largos (superior e inferior)"
        onClick={() => onChange({ ...value, top: true, bottom: true })}
      >
        Largos
      </button>
      <button
        type="button"
        title="Cantos cortos (izquierdo y derecho)"
        onClick={() => onChange({ ...value, left: true, right: true })}
      >
        Cortos
      </button>
    </div>
  )
}
