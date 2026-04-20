import type { Piece } from '../../types'
import { getPieceColor } from '../../utils/pieceColor'

interface Props {
  pieces: Piece[]
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Piece>) => void
}

export function PieceList({ pieces, onRemove, onUpdate }: Props) {
  if (pieces.length === 0) return <p className="empty-hint">Sin piezas. Agrega una arriba.</p>

  return (
    <ul className="item-list">
      {pieces.map(piece => (
        <li key={piece.id} className="item-row">
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
