import { useState } from 'react'
import type { Piece, PieceEdges } from '../../types'
import { EdgePresets, EdgeSelector } from '../EdgeSelector'
import { countEdges, NO_EDGES } from '../../utils/edges'
import { lengthToMeters, mmToUnit, unitLabel, type Unit } from '../../utils/units'

interface Props {
  unit: Unit
  onAdd: (piece: Omit<Piece, 'id'>) => void
}

export function PieceForm({ unit, onAdd }: Props) {
  const defaultWidth = String(mmToUnit(300, unit))
  const defaultHeight = String(mmToUnit(200, unit))
  const [width, setWidth] = useState(defaultWidth)
  const [height, setHeight] = useState(defaultHeight)
  const [label, setLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [canRotate, setCanRotate] = useState(true)
  const [edges, setEdges] = useState<PieceEdges>({ ...NO_EDGES })
  const [error, setError] = useState('')

  const w = Number(width)
  const h = Number(height)
  const validDims = w > 0 && h > 0
  const edgeLength = (edges.top ? w : 0) + (edges.bottom ? w : 0) + (edges.left ? h : 0) + (edges.right ? h : 0)
  const edgeMeters = validDims ? lengthToMeters(edgeLength, unit) : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = Number(quantity)
    if (w <= 0 || h <= 0 || qty < 1) {
      setError('El ancho, alto y cantidad deben ser mayores a 0.')
      return
    }
    setError('')
    onAdd({ width: w, height: h, label: label || `${width}×${height}`, quantity: qty, canRotate, edges, enabled: true })
    setLabel('')
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

      <div className="form-row form-row--edges">
        <label>Canteado</label>
        <div className="edge-field">
          <EdgeSelector value={edges} onChange={setEdges} width={w} height={h} />
          <div className="edge-field__info">
            <EdgePresets value={edges} onChange={setEdges} />
            <span className="edge-field__hint">
              {!validDims
                ? 'Define ancho y alto'
                : countEdges(edges) === 0
                  ? 'Sin canto'
                  : `${countEdges(edges)} lado${countEdges(edges) === 1 ? '' : 's'} · ${edgeMeters.toFixed(2)} m por pieza`}
            </span>
          </div>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      <button type="submit">+ Agregar pieza</button>
    </form>
  )
}
