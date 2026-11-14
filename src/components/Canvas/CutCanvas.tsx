import { useRef, useEffect, useState } from 'react'
import type { CutResult } from '../../types'
import { getPieceColor } from '../../utils/pieceColor'
import { hasEdges } from '../../utils/edges'
import { formatNumber, lengthToMeters, unitLabel, type Unit } from '../../utils/units'
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

    const padding = 20
    const maxW = canvas.width - padding * 2
    const maxH = canvas.height - padding * 2

    const scaleX = maxW / result.boardWidth
    const scaleY = maxH / result.boardHeight
    const scale = Math.min(scaleX, scaleY)

    const drawW = result.boardWidth * scale
    const drawH = result.boardHeight * scale
    const offsetX = padding + (maxW - drawW) / 2
    const offsetY = padding + (maxH - drawH) / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Board fill
    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(offsetX, offsetY, drawW, drawH)

    // Diagonal hatching to highlight waste areas
    ctx.save()
    ctx.beginPath()
    ctx.rect(offsetX, offsetY, drawW, drawH)
    ctx.clip()
    ctx.strokeStyle = 'rgba(160, 110, 60, 0.20)'
    ctx.lineWidth = 0.8
    const step = 10
    ctx.beginPath()
    for (let d = -drawH; d < drawW; d += step) {
      ctx.moveTo(offsetX + d, offsetY)
      ctx.lineTo(offsetX + d + drawW + drawH, offsetY + drawH)
    }
    ctx.stroke()
    ctx.restore()

    // Board border
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.strokeRect(offsetX, offsetY, drawW, drawH)

    // Dimensions label
    ctx.fillStyle = '#333'
    ctx.font = '13px sans-serif'
    ctx.fillText(`${formatNumber(result.boardWidth)} × ${formatNumber(result.boardHeight)} ${unitLabel(unit)}`, offsetX, offsetY - 6)

    // Placed pieces (solid fill covers hatching)
    result.placedPieces.forEach(piece => {
      const px = offsetX + piece.x * scale
      const py = offsetY + piece.y * scale
      const pw = piece.width * scale
      const ph = piece.height * scale

      const color = getPieceColor(piece.width, piece.height)
      ctx.fillStyle = color + 'CC'
      ctx.fillRect(px, py, pw, ph)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.strokeRect(px, py, pw, ph)

      // Cantos pegados: línea gruesa sobre cada lado que lleva canto
      if (hasEdges(piece.edges)) {
        const lw = Math.max(2, Math.min(5, Math.min(pw, ph) * 0.08))
        const inset = lw / 2
        ctx.strokeStyle = '#b45309'
        ctx.lineWidth = lw
        ctx.beginPath()
        if (piece.edges.top) {
          ctx.moveTo(px + inset, py + inset)
          ctx.lineTo(px + pw - inset, py + inset)
        }
        if (piece.edges.bottom) {
          ctx.moveTo(px + inset, py + ph - inset)
          ctx.lineTo(px + pw - inset, py + ph - inset)
        }
        if (piece.edges.left) {
          ctx.moveTo(px + inset, py + inset)
          ctx.lineTo(px + inset, py + ph - inset)
        }
        if (piece.edges.right) {
          ctx.moveTo(px + pw - inset, py + inset)
          ctx.lineTo(px + pw - inset, py + ph - inset)
        }
        ctx.stroke()
      }

      if (pw > 30 && ph > 18) {
        ctx.fillStyle = '#000'
        ctx.font = `${Math.min(12, ph * 0.3)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(piece.label, px + pw / 2, py + ph / 2)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }
    })

    const eff = (result.efficiency * 100).toFixed(1)
    ctx.fillStyle = '#222'
    ctx.font = '14px sans-serif'
    const footer = [`Eficiencia: ${eff}%`, `${result.placedPieces.length} piezas`]
    if (result.edgeLength > 0) footer.push(`Canto: ${formatNumber(lengthToMeters(result.edgeLength, unit))} m`)
    ctx.fillText(footer.join('  |  '), offsetX, offsetY + drawH + 18)
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
