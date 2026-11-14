import { useState } from 'react'
import type { Board } from '../../types'
import { mmToUnit, unitLabel, type Unit } from '../../utils/units'

interface Props {
  unit: Unit
  onAdd: (board: Omit<Board, 'id'>) => void
}

export function BoardForm({ unit, onAdd }: Props) {
  const defaultWidth = String(mmToUnit(2440, unit))
  const defaultHeight = String(mmToUnit(1220, unit))
  const [width, setWidth] = useState(defaultWidth)
  const [height, setHeight] = useState(defaultHeight)
  const [material, setMaterial] = useState('MDF')
  const [quantity, setQuantity] = useState('1')
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
    onAdd({ width: w, height: h, material, quantity: qty, enabled: true })
    setWidth(defaultWidth)
    setHeight(defaultHeight)
    setQuantity('1')
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-row">
        <label>Ancho ({unitLabel(unit)})</label>
        <input type="number" value={width} onChange={e => setWidth(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Alto ({unitLabel(unit)})</label>
        <input type="number" value={height} onChange={e => setHeight(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Material</label>
        <input type="text" value={material} onChange={e => setMaterial(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Cantidad</label>
        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit">+ Agregar tablero</button>
    </form>
  )
}
