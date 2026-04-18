import { useState } from 'react'
import type { Piece } from '../../types'

interface Props {
  onAdd: (piece: Omit<Piece, 'id'>) => void
}

export function PieceForm({ onAdd }: Props) {
  const [width, setWidth] = useState('300')
  const [height, setHeight] = useState('200')
  const [label, setLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [canRotate, setCanRotate] = useState(true)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({
      width: Number(width),
      height: Number(height),
      label: label || `${width}×${height}`,
      quantity: Number(quantity),
      canRotate,
    })
    setLabel('')
    setQuantity('1')
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <label>Ancho (mm)</label>
        <input type="number" value={width} onChange={e => setWidth(e.target.value)} min="1" required />
      </div>
      <div className="form-row">
        <label>Alto (mm)</label>
        <input type="number" value={height} onChange={e => setHeight(e.target.value)} min="1" required />
      </div>
      <div className="form-row">
        <label>Etiqueta</label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Puerta" />
      </div>
      <div className="form-row">
        <label>Cantidad</label>
        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" required />
      </div>
      <div className="form-row form-row--check">
        <label>
          <input type="checkbox" checked={canRotate} onChange={e => setCanRotate(e.target.checked)} />
          {' '}Permitir rotación
        </label>
      </div>
      <button type="submit">+ Agregar pieza</button>
    </form>
  )
}
