import { useState } from 'react'
import type { Piece } from '../../types'
import { getPieceColor } from '../../utils/pieceColor'

interface Props {
  pieces: Piece[]
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Piece>) => void
  onReorder: (fromIdx: number, toIdx: number) => void
}

export function PieceList({ pieces, onRemove, onUpdate, onReorder }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  if (pieces.length === 0) return <p className="empty-hint">Sin piezas. Agrega una arriba.</p>

  function handleDragStart(e: React.DragEvent, idx: number) {
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
  }

  function handleDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <ul className="item-list">
      {pieces.map((piece, idx) => (
        <li
          key={piece.id}
          className={[
            'item-row',
            dragIndex === idx ? 'dragging' : '',
            overIndex === idx && dragIndex !== idx ? 'drag-over' : '',
          ].filter(Boolean).join(' ')}
          draggable
          onDragStart={e => handleDragStart(e, idx)}
          onDragOver={e => handleDragOver(e, idx)}
          onDragLeave={handleDragLeave}
          onDrop={e => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
        >
          <span className="drag-handle" aria-hidden="true">⠿</span>
          <span
            className="piece-swatch"
            style={{ background: getPieceColor(piece.width, piece.height) }}
            aria-hidden="true"
          />
          <span className="item-label">{piece.label}</span>
          <span className="item-dims">
            {piece.width} × {piece.height} mm
          </span>
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
        </li>
      ))}
    </ul>
  )
}
