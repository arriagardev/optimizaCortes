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
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const w = Number(width)
    const h = Number(height)
    const qty = Number(quantity)
    if (w <= 0 || h <= 0 || qty < 1) {
      setError('El ancho, alto y cantidad deben ser mayores a 0.')
      return
    }
    setError('')
    onAdd({ width: w, height: h, label: label || `${width}×${height}`, quantity: qty, canRotate })
    setLabel('')
    setQuantity('1')
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <label>Ancho (mm)</label>
        <input type="number" value={width} onChange={e => setWidth(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Alto (mm)</label>
        <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Etiqueta</label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej: Puerta" />
      </div>
      <div className="form-row">
        <label>Cantidad</label>
        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
      </div>
      <div className="form-row form-row--check">
        <label>
          <input type="checkbox" checked={canRotate} onChange={e => setCanRotate(e.target.checked)} />
          {' '}Permitir rotación
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit">+ Agregar pieza</button>
    </form>
  )
}
