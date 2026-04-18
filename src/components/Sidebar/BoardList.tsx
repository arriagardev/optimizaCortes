import type { Board } from '../../types'

interface Props {
  boards: Board[]
  onRemove: (id: string) => void
  onUpdate: (id: string, updates: Partial<Board>) => void
}

export function BoardList({ boards, onRemove, onUpdate }: Props) {
  if (boards.length === 0) return <p className="empty-hint">Sin tableros. Agrega uno arriba.</p>

  return (
    <ul className="item-list">
      {boards.map(board => (
        <li key={board.id} className="item-row">
          <span className="item-label">{board.material}</span>
          <span className="item-dims">
            {board.width} × {board.height} mm
          </span>
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
        </li>
      ))}
    </ul>
  )
}
