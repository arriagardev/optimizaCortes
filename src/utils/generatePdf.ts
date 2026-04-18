import jsPDF from 'jspdf'
import type { Board, Piece, CutSolution, AppSettings } from '../types'

// Must match CutCanvas.tsx COLORS order exactly
const PIECE_COLORS: [number, number, number][] = [
  [78, 154, 241],   // #4E9AF1 blue
  [241, 169, 78],   // #F1A94E orange
  [228, 92, 85],    // #E45C55 red
  [92, 184, 92],    // #5CB85C green
  [155, 89, 182],   // #9B59B6 purple
  [26, 188, 156],   // #1ABC9C teal
  [243, 156, 18],   // #F39C12 yellow
  [41, 128, 185],   // #2980B9 dark blue
  [231, 76, 60],    // #E74C3C crimson
  [39, 174, 96],    // #27AE60 dark green
]

const PAGE_W = 210
const PAGE_H = 297
const M = 15
const CW = PAGE_W - M * 2

export function generatePdf(
  boards: Board[],
  pieces: Piece[],
  solution: CutSolution,
  settings: AppSettings,
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const unit = settings.unit
  let y = M

  // ── Helpers ───────────────────────────────────────────────────────

  function font(size: number, style: 'normal' | 'bold' = 'normal') {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
  }

  function newPage() {
    doc.addPage()
    y = M
  }

  function checkBreak(needed: number) {
    if (y + needed > PAGE_H - M) newPage()
  }

  function hLine() {
    doc.setDrawColor(210)
    doc.setLineWidth(0.2)
    doc.line(M, y, PAGE_W - M, y)
  }

  function table(
    title: string,
    headers: string[],
    colX: number[],
    rows: string[][],
  ) {
    checkBreak(16 + rows.length * 7)
    font(11, 'bold')
    doc.setTextColor(34)
    doc.text(title, M, y)
    y += 7

    doc.setFillColor(237, 241, 247)
    doc.rect(M, y - 4.5, CW, 7, 'F')
    font(8, 'bold')
    doc.setTextColor(70)
    headers.forEach((h, i) => doc.text(h, M + colX[i], y))
    y += 7

    font(8)
    doc.setFont('helvetica', 'normal')
    rows.forEach((row, ri) => {
      checkBreak(8)
      if (ri % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(M, y - 4.5, CW, 7, 'F')
      }
      doc.setTextColor(34)
      row.forEach((cell, ci) => doc.text(cell, M + colX[ci], y))
      y += 7
    })
    y += 8
  }

  // ── PAGE 1: Header + Summary + Tables ────────────────────────────

  font(18, 'bold')
  doc.setTextColor(26, 86, 219)
  doc.text('OptimizaCortes', M, y + 7)
  font(10)
  doc.setTextColor(110)
  doc.text('Reporte de Optimización de Cortes', M, y + 14)
  doc.text(
    new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }),
    PAGE_W - M,
    y + 14,
    { align: 'right' },
  )
  y += 20
  hLine()
  y += 8

  // Summary stats
  font(11, 'bold')
  doc.setTextColor(34)
  doc.text('Resumen', M, y)
  y += 7

  const totalPlaced = solution.results.reduce((s, r) => s + r.placedPieces.length, 0)
  const summaryRows: [string, string][] = [
    ['Tableros utilizados', String(solution.results.length)],
    ['Piezas colocadas', String(totalPlaced)],
    ['Piezas sin colocar', String(solution.unplacedPieces.length)],
    ['Eficiencia promedio', `${(solution.totalEfficiency * 100).toFixed(1)}%`],
    ['Grosor de cuchilla', `${settings.bladeThickness} ${unit}`],
  ]

  summaryRows.forEach(([label, val]) => {
    font(9)
    doc.setTextColor(90)
    doc.text(label, M + 2, y)
    font(9, 'bold')
    doc.setTextColor(26, 86, 219)
    doc.text(val, M + 80, y)
    y += 6
  })

  y += 6
  hLine()
  y += 10

  // Boards table
  table(
    'Tableros',
    ['Material', 'Ancho', 'Alto', 'Cantidad', `Área total (m²)`],
    [2, 55, 88, 118, 148],
    boards.map(b => [
      b.material || '—',
      String(b.width),
      String(b.height),
      String(b.quantity),
      ((b.width * b.height * b.quantity) / 1_000_000).toFixed(3),
    ]),
  )

  // Pieces table
  table(
    'Piezas requeridas',
    ['Etiqueta', 'Ancho', 'Alto', 'Cantidad', 'Rotación'],
    [2, 55, 88, 118, 148],
    pieces.map(p => [
      p.label || '—',
      String(p.width),
      String(p.height),
      String(p.quantity),
      p.canRotate ? 'Sí' : 'No',
    ]),
  )

  // Unplaced warning
  if (solution.unplacedPieces.length > 0) {
    checkBreak(20)
    doc.setFillColor(255, 243, 205)
    doc.setDrawColor(255, 193, 7)
    doc.setLineWidth(0.3)
    doc.rect(M, y, CW, 14, 'FD')
    font(8, 'bold')
    doc.setTextColor(133, 77, 14)
    doc.text(`Advertencia — piezas sin colocar (${solution.unplacedPieces.length}):`, M + 3, y + 5.5)
    font(8)
    doc.setFont('helvetica', 'normal')
    const labels = solution.unplacedPieces.map(p => p.label).join(', ')
    doc.text(labels, M + 3, y + 11, { maxWidth: CW - 6 })
    y += 20
  }

  // ── ONE PAGE PER BOARD ────────────────────────────────────────────

  solution.results.forEach((result, idx) => {
    newPage()

    const boardMeta = boards.find(b => b.id === result.boardId)
    const material = boardMeta?.material ?? 'Tablero'

    // Board header
    font(13, 'bold')
    doc.setTextColor(26, 86, 219)
    doc.text(`Tablero ${idx + 1}  ·  ${material}`, M, y)
    y += 8

    font(9)
    doc.setTextColor(80)
    doc.text(`Dimensiones: ${result.boardWidth} × ${result.boardHeight} ${unit}`, M, y)
    doc.text(`Eficiencia: ${(result.efficiency * 100).toFixed(1)}%`, PAGE_W - M, y, { align: 'right' })
    y += 4
    hLine()
    y += 8

    // Layout visualization
    const MAX_W = CW
    const MAX_H = 130
    const scale = Math.min(MAX_W / result.boardWidth, MAX_H / result.boardHeight)
    const drawW = result.boardWidth * scale
    const drawH = result.boardHeight * scale
    const ox = M + (CW - drawW) / 2

    // Board background
    doc.setFillColor(245, 240, 232)
    doc.setDrawColor(150)
    doc.setLineWidth(0.3)
    doc.rect(ox, y, drawW, drawH, 'FD')

    // Assign color index by pieceId (stable order)
    const colorIdx = new Map<string, number>()
    let ci = 0
    result.placedPieces.forEach(pp => {
      if (!colorIdx.has(pp.pieceId)) colorIdx.set(pp.pieceId, ci++)
    })

    // Draw pieces
    result.placedPieces.forEach(pp => {
      const [r, g, b] = PIECE_COLORS[(colorIdx.get(pp.pieceId) ?? 0) % PIECE_COLORS.length]
      const px = ox + pp.x * scale
      const py = y + pp.y * scale
      const pw = pp.width * scale
      const ph = pp.height * scale

      doc.setFillColor(r, g, b)
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.4)
      doc.rect(px, py, pw, ph, 'FD')

      // Label inside piece if it fits
      if (pw > 8 && ph > 5) {
        const sz = pw > 18 ? 5.5 : 4.5
        doc.setFontSize(sz)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        const lbl = pp.label.length > 14 ? pp.label.slice(0, 13) + '…' : pp.label
        doc.text(lbl, px + pw / 2, py + ph / 2 + sz * 0.18, { align: 'center' })
      }
    })

    y += drawH + 6

    // Area stats
    font(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    const usedM2 = (result.usedArea / 1_000_000).toFixed(4)
    const totalM2 = (result.totalArea / 1_000_000).toFixed(4)
    const wasteM2 = ((result.totalArea - result.usedArea) / 1_000_000).toFixed(4)
    doc.text(
      `Área usada: ${usedM2} m²   ·   Total: ${totalM2} m²   ·   Desperdicio: ${wasteM2} m²`,
      M, y,
    )
    y += 10

    // Placed pieces table
    if (result.placedPieces.length === 0) return

    font(10, 'bold')
    doc.setTextColor(34)
    doc.text(`Piezas colocadas (${result.placedPieces.length})`, M, y)
    y += 7

    doc.setFillColor(237, 241, 247)
    doc.rect(M, y - 4.5, CW, 7, 'F')
    font(7, 'bold')
    doc.setTextColor(70)
    const pHeaders = ['', 'Etiqueta', 'Ancho', 'Alto', 'Pos X', 'Pos Y', 'Girada']
    const pColX =    [2,  8,         58,      85,    112,    138,    160]
    pHeaders.forEach((h, i) => doc.text(h, M + pColX[i], y))
    y += 7

    font(7)
    doc.setFont('helvetica', 'normal')
    result.placedPieces.forEach((pp, ri) => {
      checkBreak(8)
      if (ri % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(M, y - 4.5, CW, 7, 'F')
      }
      // Color swatch
      const [r, g, b] = PIECE_COLORS[(colorIdx.get(pp.pieceId) ?? 0) % PIECE_COLORS.length]
      doc.setFillColor(r, g, b)
      doc.rect(M + 2, y - 3.5, 3.5, 3.5, 'F')

      doc.setTextColor(34)
      const cells = [pp.label, String(pp.width), String(pp.height), String(pp.x), String(pp.y), pp.rotated ? 'Sí' : 'No']
      cells.forEach((v, ci2) => doc.text(v, M + pColX[ci2 + 1], y))
      y += 7
    })
  })

  // ── Footer on every page ─────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    font(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(170)
    doc.setDrawColor(210)
    doc.setLineWidth(0.2)
    doc.line(M, PAGE_H - 10, PAGE_W - M, PAGE_H - 10)
    doc.text('OptimizaCortes', M, PAGE_H - 5)
    doc.text(`Página ${p} de ${totalPages}`, PAGE_W - M, PAGE_H - 5, { align: 'right' })
  }

  const date = new Date().toISOString().slice(0, 10)
  doc.save(`optimizaCortes-${date}.pdf`)
}
