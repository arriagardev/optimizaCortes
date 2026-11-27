import { useRef, useEffect, useState } from 'react'
import type { CutResult } from '../../types'
import type { Unit } from '../../utils/units'
import { drawBoard } from '../../utils/drawLayout'
import { CutSequence } from './CutSequence'

interface Props {
  results: CutResult[]
  unit: Unit
}

export function CutCanvas({ results, unit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [selectedBoard, setSelectedBoard] = useState(0)
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 })

  // Si el número de tableros baja, no dejamos el índice fuera de rango.
  const currentBoard = Math.min(selectedBoard, Math.max(0, results.length - 1))
  const result = results[currentBoard]

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    // Medimos también al montar: el contenedor puede cambiar de tamaño cuando
    // aparece la secuencia de cortes o al cambiar de tablero.
    const measure = () => {
      const { clientWidth, clientHeight } = el
      if (clientWidth > 0 && clientHeight > 0) {
        setCanvasSize(prev =>
          prev.width === clientWidth && prev.height === clientHeight
            ? prev
            : { width: clientWidth, height: clientHeight },
        )
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [results.length])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !result) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawBoard(ctx, result, { width: canvas.width, height: canvas.height, unit })
  }, [result, canvasSize, unit])

  if (results.length === 0) {
    return (
      <div className="canvas-empty">
        <p>Agrega tableros y piezas, luego presiona <strong>Optimizar cortes</strong>.</p>
      </div>
    )
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-toolbar">
        <button disabled={currentBoard === 0} onClick={() => setSelectedBoard(c => c - 1)}>‹</button>
        <span>Tablero {currentBoard + 1} / {results.length}</span>
        <button disabled={currentBoard === results.length - 1} onClick={() => setSelectedBoard(c => c + 1)}>›</button>
      </div>
      <div className="canvas-body">
        <div className="canvas-inner" ref={innerRef}>
          <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="cut-canvas" />
        </div>
        {result.cutSteps && result.cutSteps.length > 0 ? (
          <CutSequence steps={result.cutSteps} unit={unit} />
        ) : (
          <p className="cut-sequence__empty">
            Este layout no produce secuencia guillotina (algoritmo MaxRects). Elige Guillotine para obtener la lista de cortes.
          </p>
        )}
      </div>
    </div>
  )
}
