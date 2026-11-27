import type { CutResult } from '../types'
import { getPieceColor } from './pieceColor'
import { hasEdges } from './edges'
import { drawBoard } from './drawLayout'
import { formatNumber, lengthToMeters, unitLabel, type Unit } from './units'

const WIDTH = 1400
const BOARD_BOX_H = 760
const GAP = 40

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function filename(extension: string): string {
  return `optimizaCortes-layout-${new Date().toISOString().slice(0, 10)}.${extension}`
}

/** Exporta todos los tableros apilados en una sola imagen PNG. */
export function exportLayoutPng(results: CutResult[], unit: Unit): void {
  if (results.length === 0) return

  const height = GAP + results.length * (BOARD_BOX_H + GAP)
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  results.forEach((result, index) => {
    drawBoard(ctx, result, {
      width: WIDTH,
      height: BOARD_BOX_H,
      unit,
      y: GAP + index * (BOARD_BOX_H + GAP),
      padding: 30,
      title: `Tablero ${index + 1}`,
    })
  })

  canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, filename('png'))
  }, 'image/png')
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function svgBoard(result: CutResult, unit: Unit, index: number, top: number): string {
  const padding = 30
  const titleSpace = 18
  const footerSpace = 26
  const maxW = WIDTH - padding * 2
  const maxH = BOARD_BOX_H - padding * 2 - titleSpace - footerSpace
  const scale = Math.min(maxW / result.boardWidth, maxH / result.boardHeight)
  const drawW = result.boardWidth * scale
  const drawH = result.boardHeight * scale
  const offsetX = (WIDTH - drawW) / 2
  const offsetY = top + padding + titleSpace + (maxH - drawH) / 2

  const parts: string[] = []
  parts.push(`<text x="${padding}" y="${top + padding + 2}" font-family="sans-serif" font-size="15" font-weight="bold" fill="#1a56db">Tablero ${index + 1}</text>`)
  parts.push(`<rect x="${offsetX}" y="${offsetY}" width="${drawW}" height="${drawH}" fill="#F5F0E8" stroke="#666" stroke-width="2"/>`)
  parts.push(`<rect x="${offsetX}" y="${offsetY}" width="${drawW}" height="${drawH}" fill="url(#hatch)"/>`)

  if (result.trim > 0) {
    parts.push(
      `<rect x="${offsetX + result.trim * scale}" y="${offsetY + result.trim * scale}" width="${Math.max(0, drawW - result.trim * 2 * scale)}" height="${Math.max(0, drawH - result.trim * 2 * scale)}" fill="none" stroke="rgba(120,90,60,0.55)" stroke-width="1" stroke-dasharray="6 4"/>`,
    )
  }

  const grainLabel = result.grain === 'width' ? ' · veta ↔' : result.grain === 'height' ? ' · veta ↕' : ''
  const trimLabel = result.trim > 0 ? ` · refile ${formatNumber(result.trim)} ${unitLabel(unit)}` : ''
  parts.push(
    `<text x="${offsetX}" y="${offsetY - 6}" font-family="sans-serif" font-size="13" fill="#333">${escapeXml(
      `${formatNumber(result.boardWidth)} × ${formatNumber(result.boardHeight)} ${unitLabel(unit)}${grainLabel}${trimLabel}`,
    )}</text>`,
  )

  for (const piece of result.placedPieces) {
    const px = offsetX + piece.x * scale
    const py = offsetY + piece.y * scale
    const pw = piece.width * scale
    const ph = piece.height * scale
    const color = getPieceColor(piece.width, piece.height)

    parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="${color}" fill-opacity="0.8" stroke="${color}" stroke-width="1.5"/>`)

    if (hasEdges(piece.edges)) {
      const lw = Math.max(2, Math.min(5, Math.min(pw, ph) * 0.08))
      const inset = lw / 2
      const line = (x1: number, y1: number, x2: number, y2: number) =>
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b45309" stroke-width="${lw}"/>`
      if (piece.edges.top) parts.push(line(px + inset, py + inset, px + pw - inset, py + inset))
      if (piece.edges.bottom) parts.push(line(px + inset, py + ph - inset, px + pw - inset, py + ph - inset))
      if (piece.edges.left) parts.push(line(px + inset, py + inset, px + inset, py + ph - inset))
      if (piece.edges.right) parts.push(line(px + pw - inset, py + inset, px + pw - inset, py + ph - inset))
    }

    if (pw > 20 && ph > 14) {
      parts.push(
        `<text x="${px + 3}" y="${py + 13}" font-family="sans-serif" font-size="10" font-weight="bold" fill="rgba(0,0,0,0.72)">#${piece.step}</text>`,
      )
    }

    if (pw > 34 && ph > 18) {
      const fontSize = Math.min(12, ph * 0.3)
      parts.push(
        `<text x="${px + pw / 2}" y="${py + ph / 2}" font-family="sans-serif" font-size="${fontSize}" fill="#000" text-anchor="middle" dominant-baseline="middle">${escapeXml(piece.label)}</text>`,
      )
    }
  }

  const footer = [`Eficiencia: ${(result.efficiency * 100).toFixed(1)}%`, `${result.placedPieces.length} piezas`]
  if (result.edgeLength > 0) footer.push(`Canto: ${formatNumber(lengthToMeters(result.edgeLength, unit))} m`)
  parts.push(
    `<text x="${offsetX}" y="${offsetY + drawH + 18}" font-family="sans-serif" font-size="14" fill="#222">${escapeXml(footer.join('  |  '))}</text>`,
  )

  return parts.join('\n')
}

/** Exporta todos los tableros en un SVG vectorial (una franja por tablero). */
export function exportLayoutSvg(results: CutResult[], unit: Unit): void {
  if (results.length === 0) return

  const height = GAP + results.length * (BOARD_BOX_H + GAP)
  const boards = results
    .map((result, index) => svgBoard(result, unit, index, GAP + index * (BOARD_BOX_H + GAP)))
    .join('\n')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
  <defs>
    <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(160,110,60,0.20)" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
${boards}
</svg>`

  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename('svg'))
}
