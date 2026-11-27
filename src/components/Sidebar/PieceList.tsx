import { useEffect, useState } from 'react'
import type { Piece } from '../../types'
import { getPieceColor } from '../../utils/pieceColor'
import { hasEdges, pieceEdgeLength } from '../../utils/edges'
import { lengthToMeters, formatNumber, unitLabel, type Unit } from '../../utils/units'
import { EdgePresets, EdgeSelector } from '../EdgeSelector'

interface Props {
  pieces: Piece[]
  unit: Unit
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Piece>) => void
  onReorder: (fromIdx: number, toIdx: number) => void
}

interface DimensionEditorProps {
  piece: Piece
  unit: Unit
  onUpdate: (id: string, updates: Partial<Piece>) => void
}

/** Edición de dimensiones y etiqueta; confirma al salir del campo para no llenar el historial. */
function DimensionEditor({ piece, unit, onUpdate }: DimensionEditorProps) {
  const [width, setWidth] = useState(String(piece.width))
  const [height, setHeight] = useState(String(piece.height))
  const [label, setLabel] = useState(piece.label)

  useEffect(() => {
    setWidth(String(piece.width))
    setHeight(String(piece.height))
    setLabel(piece.label)
  }, [piece.width, piece.height, piece.label])

  function commit() {
    const w = Number(width)
    const h = Number(height)
    if (!(w > 0) || !(h > 0)) {
      setWidth(String(piece.width))
      setHeight(String(piece.height))
      return
    }
    onUpdate(piece.id, { width: w, height: h, label: label.trim() || piece.label })
  }

  return (
    <div className="item-detail__dims">
      <label>
        Ancho
        <input
          type="number"
          value={width}
          min="0"
          step="0.1"
          onChange={e => setWidth(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
        />
      </label>
      <label>
        Alto
        <input
          type="number"
          value={height}
          min="0"
          step="0.1"
          onChange={e => setHeight(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
        />
      </label>
      <label className="item-detail__label">
        Etiqueta
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
        />
      </label>
      <span className="item-detail__unit">{unitLabel(unit)}</span>
    </div>
  )
}

export function PieceList({ pieces, unit, onRemove, onUpdate, onReorder }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [dragReady, setDragReady] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  if (pieces.length === 0) return <p className="empty-hint">Sin piezas. Agrega una arriba.</p>

  function handleDragStart(e: React.DragEvent, idx: number) {
    // Solo el handle ⠿ inicia el arrastre (evita mover filas al editar cantos o cantidades)
    const target = e.target as HTMLElement
    if (!target.closest('.drag-handle')) {
      e.preventDefault()
      return
    }
    setDragIndex(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Firefox requires setData to initiate drag
    e.dataTransfer.setData('text/plain', String(idx))
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (idx !== overIndex) setOverIndex(idx)
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear if leaving the list item entirely (not entering a child)
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    setOverIndex(null)
  }

  function handleDrop(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIndex !== null && dragIndex !== idx) {
      onReorder(dragIndex, idx)
    }
    setDragIndex(null)
    setOverIndex(null)
    setDragReady(null)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
    setDragReady(null)
  }

  return (
    <ul className="item-list">
      {pieces.map((piece, idx) => {
        const banded = hasEdges(piece.edges)
        const isExpanded = expanded === piece.id
        const enabled = piece.enabled !== false
        return (
          <li
            key={piece.id}
            className={[
              'item-row',
              'item-row--piece',
              enabled ? '' : 'item-row--disabled',
              isExpanded ? 'item-row--expanded' : '',
              dragIndex === idx ? 'dragging' : '',
              overIndex === idx && dragIndex !== idx ? 'drag-over' : '',
            ].filter(Boolean).join(' ')}
            draggable={dragReady === idx}
            onDragStart={e => handleDragStart(e, idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
          >
            <div className="item-main">
              <span
                className="drag-handle"
                aria-hidden="true"
                onMouseDown={() => setDragReady(idx)}
              >
                ⠿
              </span>
              <label
                className="item-toggle"
                title={enabled ? 'Deshabilitar pieza' : 'Habilitar pieza'}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={e => onUpdate(piece.id, { enabled: e.target.checked })}
                  aria-label={`Usar pieza ${piece.label}`}
                />
              </label>
              <span
                className="piece-swatch"
                style={{ background: getPieceColor(piece.width, piece.height) }}
                aria-hidden="true"
              />
              <span className="item-label">{piece.label}</span>
              <input
                type="number"
                className="qty-input"
                value={piece.quantity}
                min="1"
                onChange={e => onUpdate(piece.id, { quantity: Number(e.target.value) })}
              />
              <button className="remove-btn" onClick={() => onRemove(piece.id)} title="Eliminar">
                ×
              </button>
            </div>
            <div className="item-sub">
              <span className="item-dims">
                {formatNumber(piece.width)} × {formatNumber(piece.height)} {unitLabel(unit)}
              </span>
              {piece.grain && <span className="grain-chip" title="Requiere veta">↔ veta</span>}
              <button
                type="button"
                className={`edge-chip${banded ? ' edge-chip--on' : ''}`}
                aria-expanded={isExpanded}
                title="Editar dimensiones, canteado, veta y orden"
                onClick={() => setExpanded(current => (current === piece.id ? null : piece.id))}
              >
                Editar
              </button>
            </div>

            {isExpanded && (
              <div className="item-detail" onMouseDown={() => setDragReady(null)}>
                <DimensionEditor piece={piece} unit={unit} onUpdate={onUpdate} />
                <div className="item-detail__edges">
                  <EdgeSelector
                    compact
                    value={piece.edges}
                    width={piece.width}
                    height={piece.height}
                    onChange={edges => onUpdate(piece.id, { edges })}
                  />
                  <EdgePresets value={piece.edges} onChange={edges => onUpdate(piece.id, { edges })} />
                </div>
                <div className="item-detail__meta">
                  <label className="item-detail__check">
                    <input
                      type="checkbox"
                      checked={piece.grain}
                      onChange={e => onUpdate(piece.id, { grain: e.target.checked })}
                    />
                    {' '}Requiere veta
                  </label>
                  <label className="item-detail__check">
                    <input
                      type="checkbox"
                      checked={piece.canRotate}
                      onChange={e => onUpdate(piece.id, { canRotate: e.target.checked })}
                      disabled={piece.grain}
                    />
                    {' '}Permitir rotación
                  </label>
                  <span>
                    {banded
                      ? `${formatNumber(lengthToMeters(pieceEdgeLength(piece), unit))} m de canto por pieza · ${formatNumber(
                          lengthToMeters(pieceEdgeLength(piece) * piece.quantity, unit),
                        )} m en total`
                      : 'Esta pieza no lleva canto'}
                  </span>
                  <div className="item-detail__actions">
                    <button
                      type="button"
                      className="btn-mini"
                      disabled={idx === 0}
                      onClick={() => onReorder(idx, idx - 1)}
                      title="Mover arriba"
                    >
                      ↑ Subir
                    </button>
                    <button
                      type="button"
                      className="btn-mini"
                      disabled={idx === pieces.length - 1}
                      onClick={() => onReorder(idx, idx + 1)}
                      title="Mover abajo"
                    >
                      ↓ Bajar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
