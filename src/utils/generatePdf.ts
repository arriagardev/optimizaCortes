import jsPDF from 'jspdf'
import type { Board, Piece, CutSolution, CutResult, AppSettings } from '../types'
import { getPieceColorRgb } from './pieceColor'
import { edgesLabel, hasEdges, summarizeEdgeBanding, unplacedSummary } from './edges'
import { cutOrientationLabel, numberPanelCuts } from './cutSequence'
import { activeBoards, activePieces } from './active'
import { GRAIN_SHORT } from './grain'
import {
  areaToM2,
  formatMoney,
  formatMeters,
  formatNumber,
  lengthToMeters,
  unitLabel,
} from './units'

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
  // Solo los elementos habilitados forman parte del reporte.
  const usableBoards = activeBoards(boards)
  const usablePieces = activePieces(pieces)
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
  const placedPieces = solution.results.flatMap(r => r.placedPieces)
  const bandingRows = summarizeEdgeBanding(usablePieces, placedPieces)
  const edgeMeters = lengthToMeters(solution.totalEdgeLength, unit)
  const boardAreaM2 = areaToM2(solution.results.reduce((s, r) => s + r.totalArea, 0), unit)
  const boardCost = boardAreaM2 * (settings.boardCostPerM2 || 0)
  const wasteAreaM2 = areaToM2(
    solution.results.reduce((sum, r) => sum + (r.totalArea - r.usedArea), 0),
    unit,
  )
  const wasteCost = wasteAreaM2 * (settings.boardCostPerM2 || 0)
  const edgeCost = edgeMeters * (settings.edgeCostPerMeter || 0)
  const summaryRows: [string, string][] = [
    ['Tableros utilizados', String(solution.results.length)],
    ['Piezas colocadas', String(totalPlaced)],
    ['Piezas sin colocar', String(solution.unplacedPieces.length)],
    ['Eficiencia promedio', `${(solution.totalEfficiency * 100).toFixed(1)}%`],
    ['Cuchilla X × Y', `${formatNumber(settings.kerfX)} × ${formatNumber(settings.kerfY)} ${unitLabel(unit)}`],
    ['Canto total', formatMeters(edgeMeters)],
  ]
  if (settings.boardCostPerM2 > 0 || settings.edgeCostPerMeter > 0) {
    summaryRows.push(
      ['Costo de material', formatMoney(boardCost, settings.currency)],
      ['Costo del desperdicio', formatMoney(wasteCost, settings.currency)],
      ['Costo de canto', formatMoney(edgeCost, settings.currency)],
      ['Costo total estimado', formatMoney(boardCost + edgeCost, settings.currency)],
    )
  }

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
    ['Material', 'Ancho', 'Alto', 'Cant.', 'Veta', 'Refile', 'Área útil (m²)'],
    [2, 42, 64, 84, 104, 124, 152],
    usableBoards.map(b => {
      const usable = Math.max(0, b.width - b.trim * 2) * Math.max(0, b.height - b.trim * 2)
      return [
        b.material || '—',
        formatNumber(b.width),
        formatNumber(b.height),
        String(b.quantity),
        GRAIN_SHORT[b.grain],
        b.trim > 0 ? formatNumber(b.trim) : '—',
        formatNumber(areaToM2(usable * b.quantity, unit), 3),
      ]
    }),
  )

  // Pieces table
  table(
    `Piezas requeridas (${unitLabel(unit)})`,
    ['Etiqueta', 'Ancho', 'Alto', 'Cant.', 'Rotación', 'Veta', 'Canto'],
    [2, 44, 66, 86, 106, 126, 152],
    usablePieces.map(p => [
      p.label || '—',
      formatNumber(p.width),
      formatNumber(p.height),
      String(p.quantity),
      p.canRotate ? 'Sí' : 'No',
      p.grain ? 'Sí' : '—',
      edgesLabel(p.edges),
    ]),
  )

  // Edge banding summary
  if (bandingRows.length > 0) {
    const totalEdgeM = lengthToMeters(bandingRows.reduce((sum, row) => sum + row.length, 0), unit)
    table(
      'Canteado',
      ['Etiqueta', 'Colocadas', 'Lados', 'Metros lineales'],
      [2, 62, 96, 148],
      [
        ...bandingRows.map(row => [
          row.label || '—',
          String(row.placedCount),
          edgesLabel(row.edges),
          formatNumber(lengthToMeters(row.length, unit)),
        ]),
        ['Total', String(bandingRows.reduce((n, row) => n + row.placedCount, 0)), '', formatNumber(totalEdgeM)],
      ],
    )
  }

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
    const labels = unplacedSummary(usablePieces, placedPieces)
      .map(row => `${row.piece.label} ×${row.missing}`)
      .join(', ')
    doc.text(labels, M + 3, y + 11, { maxWidth: CW - 6 })
    y += 20
  }

  // ── ONE PAGE PER BOARD ────────────────────────────────────────────

  function renderCutSequence(result: CutResult, title: string, showHint = true) {
    if (!result.cutSteps || result.cutSteps.length === 0) return
    const steps = numberPanelCuts(result.cutSteps)
    if (showHint) {
      y += 4
      font(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(120)
      doc.text(
        'Medida desde el borde izquierdo (corte vertical) o superior (corte horizontal) del panel.',
        M, y,
      )
      y += 4
    }
    table(
      title,
      ['#', 'Panel', 'Corte', 'Medida', 'Pieza'],
      [2, 12, 62, 102, 148],
      steps.map((step, i) => [
        String(i + 1),
        `P${step.panelNo} · ${formatNumber(step.panelWidth)}×${formatNumber(step.panelHeight)}`,
        cutOrientationLabel(step.orientation),
        formatNumber(step.offset),
        step.label,
      ]),
    )
  }

  function renderBoardPage(result: CutResult, idx: number, includeSequence: boolean) {
    newPage()

    const boardMeta = usableBoards.find(b => b.id === result.boardId)
    const material = boardMeta?.material ?? 'Tablero'

    // Board header
    font(13, 'bold')
    doc.setTextColor(26, 86, 219)
    doc.text(`Tablero ${idx + 1}  ·  ${material}`, M, y)
    y += 8

    font(9)
    doc.setTextColor(80)
    doc.text(`Dimensiones: ${formatNumber(result.boardWidth)} × ${formatNumber(result.boardHeight)} ${unitLabel(unit)}`, M, y)
    y += 4
    const grainText = result.grain === 'width' ? 'Veta horizontal ↔' : result.grain === 'height' ? 'Veta vertical ↕' : 'Sin veta'
    const trimText = result.trim > 0 ? ` · Refile ${formatNumber(result.trim)} ${unitLabel(unit)}` : ''
    doc.text(`${grainText}${trimText}`, M, y)
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

    // Zona descartada por refile
    if (result.trim > 0) {
      doc.setDrawColor(175, 150, 120)
      doc.setLineWidth(0.2)
      doc.rect(
        ox + result.trim * scale,
        y + result.trim * scale,
        Math.max(0, drawW - result.trim * 2 * scale),
        Math.max(0, drawH - result.trim * 2 * scale),
      )
    }

    // Draw pieces
    result.placedPieces.forEach(pp => {
      const [r, g, b] = getPieceColorRgb(pp.width, pp.height)
      const px = ox + pp.x * scale
      const py = y + pp.y * scale
      const pw = pp.width * scale
      const ph = pp.height * scale

      doc.setFillColor(r, g, b)
      doc.setDrawColor(255, 255, 255)
      doc.setLineWidth(0.4)
      doc.rect(px, py, pw, ph, 'FD')

      // Número de pieza para el taller
      if (pw > 8 && ph > 5) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(4.6)
        doc.setTextColor(255, 255, 255)
        doc.text(`#${pp.step}`, px + 1.4, py + 3.4)
      }

      // Label inside piece if it fits
      if (pw > 8 && ph > 5) {
        const sz = pw > 18 ? 5.5 : 4.5
        doc.setFontSize(sz)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        const lbl = pp.label.length > 14 ? pp.label.slice(0, 13) + '…' : pp.label
        doc.text(lbl, px + pw / 2, py + ph / 2 + sz * 0.18, { align: 'center' })
      }

      // Banded edges: grueso remarcado en cada lado con canto
      if (hasEdges(pp.edges)) {
        doc.setDrawColor(180, 83, 9)
        doc.setLineWidth(Math.max(0.5, Math.min(1.6, Math.min(pw, ph) * 0.12)))
        if (pp.edges.top) doc.line(px, py, px + pw, py)
        if (pp.edges.bottom) doc.line(px, py + ph, px + pw, py + ph)
        if (pp.edges.left) doc.line(px, py, px, py + ph)
        if (pp.edges.right) doc.line(px + pw, py, px + pw, py + ph)
      }
    })

    y += drawH + 6

    // Area stats
    font(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80)
    const usedM2 = formatNumber(areaToM2(result.usedArea, unit), 4)
    const totalM2 = formatNumber(areaToM2(result.totalArea, unit), 4)
    const wasteM2 = formatNumber(areaToM2(result.totalArea - result.usedArea, unit), 4)
    doc.text(
      `Área usada: ${usedM2} m²   ·   Útil: ${totalM2} m²   ·   Desperdicio: ${wasteM2} m²   ·   Canto: ${formatNumber(lengthToMeters(result.edgeLength, unit))} m`,
      M, y,
    )
    y += 10

    // Placed pieces table
    if (result.placedPieces.length === 0) return

    font(10, 'bold')
    doc.setTextColor(34)
    doc.text(`Piezas colocadas (${result.placedPieces.length}) · ${unitLabel(unit)}`, M, y)
    y += 7

    doc.setFillColor(237, 241, 247)
    doc.rect(M, y - 4.5, CW, 7, 'F')
    font(7, 'bold')
    doc.setTextColor(70)
    const pHeaders = ['', '#', 'Etiqueta', 'Ancho', 'Alto', 'Pos X', 'Pos Y', 'Girada', 'Canto']
    const pColX =    [2, 10,  24,        58,      76,    94,      114,    134,      156]
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
      const [r, g, b] = getPieceColorRgb(pp.width, pp.height)
      doc.setFillColor(r, g, b)
      doc.rect(M + 2, y - 3.5, 3.5, 3.5, 'F')

      doc.setTextColor(34)
      const cells = [String(pp.step), pp.label, formatNumber(pp.width), formatNumber(pp.height), formatNumber(pp.x), formatNumber(pp.y), pp.rotated ? 'Sí' : 'No', edgesLabel(pp.edges)]
      cells.forEach((v, ci2) => doc.text(v, M + pColX[ci2 + 1], y))
      y += 7
    })

    // Cut sequence (guillotine only)
    if (!includeSequence) return
    if (result.cutSteps && result.cutSteps.length > 0) {
      renderCutSequence(result, `Secuencia de cortes (${unitLabel(unit)})`)
    } else {
      font(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(150)
      doc.text('Sin secuencia de cortes: el layout se generó con MaxRects.', M, y)
      y += 6
    }
  }

  const sequenceAtEnd = settings.pdfSequenceOrder === 'end'
  solution.results.forEach((result, idx) => renderBoardPage(result, idx, !sequenceAtEnd))

  // ── CUT SEQUENCES AT THE END ──────────────────────────────────────
  if (sequenceAtEnd) {
    const withSequence = solution.results
      .map((result, idx) => ({ result, idx }))
      .filter(item => (item.result.cutSteps?.length ?? 0) > 0)

    if (withSequence.length > 0) {
      newPage()
      font(16, 'bold')
      doc.setTextColor(26, 86, 219)
      doc.text('Secuencias de cortes', M, y + 6)
      font(9)
      doc.setTextColor(110)
      doc.text(
        'Medida desde el borde izquierdo (corte vertical) o superior (corte horizontal) del panel.',
        M, y + 13,
      )
      y += 22

      withSequence.forEach(({ result, idx }) => {
        checkBreak(26)
        const material = usableBoards.find(b => b.id === result.boardId)?.material ?? 'Tablero'
        font(11, 'bold')
        doc.setTextColor(34)
        doc.text(`Tablero ${idx + 1} · ${material}`, M, y)
        y += 7
        renderCutSequence(result, `Cortes (${unitLabel(unit)})`, false)
      })
    } else if (solution.results.some(r => r.placedPieces.length > 0)) {
      checkBreak(12)
      font(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(150)
      doc.text('Sin secuencia de cortes: el layout se generó con MaxRects.', M, y)
      y += 6
    }
  }

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
