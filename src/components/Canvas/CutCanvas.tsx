import { useRef, useEffect, useState } from 'react'
import type { CutResult } from '../../types'

const COLORS = [
  '#4E9AF1', '#F1A94E', '#E45C55', '#5CB85C', '#9B59B6',
  '#1ABC9C', '#F39C12', '#2980B9', '#E74C3C', '#27AE60',
]

interface Props {
  results: CutResult[]
}

export function CutCanvas({ results }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [currentBoard, setCurrentBoard] = useState(0)
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 })

  const result = results[currentBoard]

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = el
      if (clientWidth > 0 && clientHeight > 0) {
        setCanvasSize({ width: clientWidth, height: clientHeight })
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

    ctx.fillStyle = '#F5F0E8'
    ctx.fillRect(offsetX, offsetY, drawW, drawH)
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.strokeRect(offsetX, offsetY, drawW, drawH)

    ctx.fillStyle = '#333'
    ctx.font = '13px sans-serif'
    ctx.fillText(`${result.boardWidth} × ${result.boardHeight} mm`, offsetX, offsetY - 6)

    result.placedPieces.forEach((piece, i) => {
      const px = offsetX + piece.x * scale
      const py = offsetY + piece.y * scale
      const pw = piece.width * scale
      const ph = piece.height * scale

      const color = COLORS[i % COLORS.length]
      ctx.fillStyle = color + 'CC'
      ctx.fillRect(px, py, pw, ph)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.strokeRect(px, py, pw, ph)

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
    ctx.fillText(`Eficiencia: ${eff}%  |  ${result.placedPieces.length} piezas`, offsetX, offsetY + drawH + 18)
  }, [result, canvasSize])

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
        <button disabled={currentBoard === 0} onClick={() => setCurrentBoard(c => c - 1)}>‹</button>
        <span>Tablero {currentBoard + 1} / {results.length}</span>
        <button disabled={currentBoard === results.length - 1} onClick={() => setCurrentBoard(c => c + 1)}>›</button>
      </div>
      <div className="canvas-inner" ref={innerRef}>
        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height} className="cut-canvas" />
      </div>
    </div>
  )
}
