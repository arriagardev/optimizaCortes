import type { CutResult } from '../types'
import { getPieceColor } from './pieceColor'
import { hasEdges } from './edges'
import { formatNumber, lengthToMeters, unitLabel, type Unit } from './units'

export interface DrawBoardOptions {
  /** Ancho de la caja disponible. */
  width: number
  /** Alto de la caja disponible. */
  height: number
  unit: Unit
  /** Esquina superior izquierda de la caja. */
  x?: number
  y?: number
  padding?: number
  /** Título opcional sobre el tablero, ej. "Tablero 1". */
  title?: string
}

/**
 * Dibuja un tablero optimizado dentro de una caja. Lo usan el canvas de la app
 * y los exportadores PNG/SVG para que ambos se vean igual.
 */
export function drawBoard(ctx: CanvasRenderingContext2D, result: CutResult, options: DrawBoardOptions): void {
  const { width, height, unit } = options
  const x = options.x ?? 0
  const y = options.y ?? 0
  const padding = options.padding ?? 20
  const titleSpace = options.title ? 18 : 0
  const footerSpace = 26

  const maxW = Math.max(1, width - padding * 2)
  const maxH = Math.max(1, height - padding * 2 - titleSpace - footerSpace)
  const scale = Math.min(maxW / result.boardWidth, maxH / result.boardHeight)
  const drawW = result.boardWidth * scale
  const drawH = result.boardHeight * scale
  const offsetX = x + padding + (maxW - drawW) / 2
  const offsetY = y + padding + titleSpace + (maxH - drawH) / 2

  if (options.title) {
    ctx.fillStyle = '#1a56db'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(options.title, x + padding, y + padding + 2)
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

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

  // Zona descartada por refile
  if (result.trim > 0) {
    ctx.save()
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(120, 90, 60, 0.55)'
    ctx.lineWidth = 1
    ctx.strokeRect(
      offsetX + result.trim * scale,
      offsetY + result.trim * scale,
      Math.max(0, drawW - result.trim * 2 * scale),
      Math.max(0, drawH - result.trim * 2 * scale),
    )
    ctx.restore()
  }

  // Dimensions + grain label
  const grainLabel = result.grain === 'width' ? ' · veta ↔' : result.grain === 'height' ? ' · veta ↕' : ''
  const trimLabel = result.trim > 0 ? ` · refile ${formatNumber(result.trim)} ${unitLabel(unit)}` : ''
  ctx.fillStyle = '#333'
  ctx.font = '13px sans-serif'
  ctx.fillText(
    `${formatNumber(result.boardWidth)} × ${formatNumber(result.boardHeight)} ${unitLabel(unit)}${grainLabel}${trimLabel}`,
    offsetX,
    offsetY - 6,
  )

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

    // Número de pieza para el taller
    if (pw > 20 && ph > 14) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.72)'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`#${piece.step}`, px + 3, py + 3)
    }

    if (pw > 34 && ph > 18) {
      ctx.fillStyle = '#000'
      ctx.font = `${Math.min(12, ph * 0.3)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(piece.label, px + pw / 2, py + ph / 2, Math.max(10, pw - 6))
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
  })

  const eff = (result.efficiency * 100).toFixed(1)
  ctx.fillStyle = '#222'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const footer = [`Eficiencia: ${eff}%`, `${result.placedPieces.length} piezas`]
  if (result.edgeLength > 0) footer.push(`Canto: ${formatNumber(lengthToMeters(result.edgeLength, unit))} m`)
  ctx.fillText(footer.join('  |  '), offsetX, offsetY + drawH + 18)
}
