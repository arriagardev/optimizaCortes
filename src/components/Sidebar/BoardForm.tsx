import { useState } from 'react'
import type { Board } from '../../types'

interface Props {
  onAdd: (board: Omit<Board, 'id'>) => void
}

export function BoardForm({ onAdd }: Props) {
  const [width, setWidth] = useState('2440')
  const [height, setHeight] = useState('1220')
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
    onAdd({ width: w, height: h, material, quantity: qty })
    setWidth('2440')
    setHeight('1220')
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
