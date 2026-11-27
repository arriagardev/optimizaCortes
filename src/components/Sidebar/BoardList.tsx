import { useEffect, useState } from 'react'
import type { Board, GrainDirection } from '../../types'
import { GRAIN_LABEL, GRAIN_SHORT } from '../../utils/grain'
import { formatNumber, unitLabel, type Unit } from '../../utils/units'

interface Props {
  boards: Board[]
  unit: Unit
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Board>) => void
}

interface DetailProps {
  board: Board
  unit: Unit
  onUpdate: (id: string, updates: Partial<Board>) => void
}

/** Edición de veta y refile de un tablero ya agregado. */
function BoardDetail({ board, unit, onUpdate }: DetailProps) {
  const [trim, setTrim] = useState(String(board.trim))

  useEffect(() => {
    setTrim(String(board.trim))
  }, [board.trim])

  function commitTrim() {
    const value = Number(trim)
    if (!Number.isFinite(value) || value < 0) {
      setTrim(String(board.trim))
      return
    }
    onUpdate(board.id, { trim: value })
  }

  return (
    <div className="item-detail">
      <div className="item-detail__dims">
        <label>
          Veta
          <select
            value={board.grain}
            onChange={e => onUpdate(board.id, { grain: e.target.value as GrainDirection })}
          >
            {(Object.keys(GRAIN_LABEL) as GrainDirection[]).map(direction => (
              <option key={direction} value={direction}>{GRAIN_LABEL[direction]}</option>
            ))}
          </select>
        </label>
        <label>
          Refile por borde ({unitLabel(unit)})
          <input
            type="number"
            value={trim}
            min="0"
            step="0.5"
            onChange={e => setTrim(e.target.value)}
            onBlur={commitTrim}
            onKeyDown={e => e.key === 'Enter' && commitTrim()}
          />
        </label>
      </div>
      <p className="form-hint">
        El refile se descarta en los cuatro bordes antes de acomodar las piezas. La veta obliga a las piezas
        marcadas a conservar esa dirección.
      </p>
    </div>
  )
}

export function BoardList({ boards, unit, onRemove, onUpdate }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (boards.length === 0) return <p className="empty-hint">Sin tableros. Agrega uno arriba.</p>

  return (
    <ul className="item-list">
      {boards.map(board => {
        const enabled = board.enabled !== false
        const isExpanded = expanded === board.id
        return (
          <li
            key={board.id}
            className={[
              'item-row',
              'item-row--board',
              enabled ? '' : 'item-row--disabled',
              isExpanded ? 'item-row--expanded' : '',
            ].filter(Boolean).join(' ')}
          >
            <div className="item-main">
              <label className="item-toggle" title={enabled ? 'Deshabilitar tablero' : 'Habilitar tablero'}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => onUpdate(board.id, { enabled: e.target.checked })}
                  aria-label={`Usar tablero ${board.material}`}
                />
              </label>
              <span className="item-label">{board.material}</span>
              <input
                type="number"
                className="qty-input"
                value={board.quantity}
                min="1"
                onChange={e => onUpdate(board.id, { quantity: Number(e.target.value) })}
              />
              <button className="remove-btn" onClick={() => onRemove(board.id)} title="Eliminar">
                ×
              </button>
            </div>
            <div className="item-sub">
              <span className="item-dims">
                {formatNumber(board.width)} × {formatNumber(board.height)} {unitLabel(unit)}
                {board.grain !== 'none' && (
                  <span className="grain-chip" aria-label={GRAIN_LABEL[board.grain]}>
                    {GRAIN_SHORT[board.grain]} veta
                  </span>
                )}
                {board.trim > 0 && (
                  <span className="grain-chip" title={`Refile ${formatNumber(board.trim)} ${unitLabel(unit)} por borde`}>
                    refile {formatNumber(board.trim)}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="edge-chip"
                aria-expanded={isExpanded}
                title="Editar veta y refile"
                onClick={() => setExpanded(current => (current === board.id ? null : board.id))}
              >
                Editar
              </button>
            </div>

            {isExpanded && <BoardDetail board={board} unit={unit} onUpdate={onUpdate} />}
          </li>
        )
      })}
    </ul>
  )
}
