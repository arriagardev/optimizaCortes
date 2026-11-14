import { useState } from 'react'
import type { Piece } from '../../types'
import { getPieceColor } from '../../utils/pieceColor'
import { countEdges, hasEdges, pieceEdgeLength } from '../../utils/edges'
import { EdgePresets, EdgeSelector } from '../EdgeSelector'

interface Props {
  pieces: Piece[]
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Piece>) => void
  onReorder: (fromIdx: number, toIdx: number) => void
}

export function PieceList({ pieces, onRemove, onUpdate, onReorder }: Props) {
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
        return (
          <li
            key={piece.id}
            className={[
              'item-row',
              'item-row--piece',
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
                {piece.width} × {piece.height} mm
              </span>
              <button
                type="button"
                className={`edge-chip${banded ? ' edge-chip--on' : ''}`}
                aria-expanded={isExpanded}
                title="Editar canteado, orden y duplicar"
                onClick={() => setExpanded(current => (current === piece.id ? null : piece.id))}
              >
                {banded ? `Canto · ${countEdges(piece.edges)}` : 'Canto —'}
              </button>
            </div>

            {isExpanded && (
              <div className="item-detail" onMouseDown={() => setDragReady(null)}>
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
                  <span>
                    {banded
                      ? `${(pieceEdgeLength(piece) / 1000).toFixed(2)} m por pieza · ${((pieceEdgeLength(piece) * piece.quantity) / 1000).toFixed(2)} m en total`
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
