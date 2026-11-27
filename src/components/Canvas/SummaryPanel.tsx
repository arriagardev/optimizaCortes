import { useState } from 'react'
import type { Board, Piece, CutSolution, AppSettings } from '../../types'
import { generatePdf } from '../../utils/generatePdf'
import { unplacedSummary } from '../../utils/edges'
import { activePieces } from '../../utils/active'
import { findFreeAreas } from '../../utils/freeRects'
import { exportLayoutPng, exportLayoutSvg } from '../../utils/exportLayout'
import {
  areaToM2,
  formatArea,
  formatMoney,
  formatMeters,
  formatNumber,
  lengthToMeters,
} from '../../utils/units'

interface Props {
  solution: CutSolution
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
  onAddBoards: (boards: Omit<Board, 'id'>[]) => void
}

export function SummaryPanel({ solution, boards, pieces, settings, onAddBoards }: Props) {
  const [offcutsSaved, setOffcutsSaved] = useState(false)
  const unit = settings.unit
  const placed = solution.results.flatMap(r => r.placedPieces)
  const wasteArea = areaToM2(solution.results.reduce((sum, r) => sum + (r.totalArea - r.usedArea), 0), unit)
  const edgeMeters = lengthToMeters(solution.totalEdgeLength, unit)
  const missing = unplacedSummary(activePieces(pieces), placed)
  const missingUnits = missing.reduce((sum, row) => sum + row.missing, 0)

  const boardAreaM2 = areaToM2(solution.results.reduce((sum, r) => sum + r.totalArea, 0), unit)
  const boardCost = boardAreaM2 * (settings.boardCostPerM2 || 0)
  const wasteCost = wasteArea * (settings.boardCostPerM2 || 0)
  const edgeCost = edgeMeters * (settings.edgeCostPerMeter || 0)
  const totalCost = boardCost + edgeCost
  const showCosts = settings.boardCostPerM2 > 0 || settings.edgeCostPerMeter > 0

  const boardById = new Map(boards.map(board => [board.id, board]))
  const offcutGroups = new Map<string, Omit<Board, 'id'>>()
  for (const result of solution.results) {
    const meta = boardById.get(result.boardId)
    if (!meta) continue
    for (const area of findFreeAreas(result, settings.kerfX, settings.kerfY)) {
      const width = Number(area.width.toFixed(2))
      const height = Number(area.height.toFixed(2))
      if (!(width > 0) || !(height > 0)) continue
      const material = `${meta.material || 'Tablero'} (retazo)`
      const key = `${material}|${width}|${height}|${meta.grain}`
      const existing = offcutGroups.get(key)
      if (existing) {
        // Retazos idénticos se agrupan como un solo tablero con cantidad.
        existing.quantity += 1
      } else {
        offcutGroups.set(key, {
          width,
          height,
          material,
          quantity: 1,
          grain: meta.grain,
          trim: 0,
          enabled: true,
        })
      }
    }
  }
  const offcuts = [...offcutGroups.values()]
  const offcutUnits = offcuts.reduce((sum, board) => sum + board.quantity, 0)

  function handleExportPdf() {
    generatePdf(boards, pieces, solution, settings)
  }

  function handleSaveOffcuts() {
    if (offcuts.length === 0) return
    onAddBoards(offcuts)
    setOffcutsSaved(true)
  }

  return (
    <div className="summary-panel">
      <div className="summary-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3>Resumen</h3>
          <span className={`algo-badge algo-badge--${solution.algorithmUsed}`}>
            {solution.algorithmUsed === 'guillotine' ? 'Guillotine' : 'MaxRects'}
          </span>
        </div>
        <div className="summary-actions">
          <button className="btn-pdf" onClick={handleExportPdf}>
            Exportar PDF
          </button>
          <button className="btn-pdf" onClick={() => exportLayoutPng(solution.results, unit)}>
            PNG
          </button>
          <button className="btn-pdf" onClick={() => exportLayoutSvg(solution.results, unit)}>
            SVG
          </button>
        </div>
      </div>
      <div className="summary-stats">
        <div className="stat">
          <span className="stat-value">{solution.results.length}</span>
          <span className="stat-label">Tableros usados</span>
        </div>
        <div className="stat">
          <span className="stat-value">{(solution.totalEfficiency * 100).toFixed(1)}%</span>
          <span className="stat-label">Eficiencia promedio</span>
        </div>
        <div className="stat">
          <span className="stat-value">{missingUnits}</span>
          <span className="stat-label">Unidades sin colocar</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatNumber(edgeMeters)}<small> m</small></span>
          <span className="stat-label">Canto lineales</span>
        </div>
        <div className="stat">
          <span className="stat-value">{formatNumber(wasteArea)}<small> m²</small></span>
          <span className="stat-label">Desperdicio</span>
        </div>
        {showCosts && (
          <div className="stat stat--cost">
            <span className="stat-value">{formatMoney(totalCost, settings.currency)}</span>
            <span className="stat-label">Costo estimado</span>
          </div>
        )}
      </div>
      {showCosts && (
        <p className="summary-cost-detail">
          Material ({formatArea(boardAreaM2)}): <strong>{formatMoney(boardCost, settings.currency)}</strong>
          {' · '}
          Desperdicio ({formatArea(wasteArea)}): <strong>{formatMoney(wasteCost, settings.currency)}</strong>
          {' · '}
          Canto ({formatMeters(edgeMeters)}): <strong>{formatMoney(edgeCost, settings.currency)}</strong>
        </p>
      )}
      {missing.length > 0 && (
        <div className="unplaced-warning">
          <strong>Piezas sin colocar:</strong>{' '}
          {missing.map(row => `${row.piece.label} ×${row.missing}`).join(', ')}
        </div>
      )}
      {offcuts.length > 0 && (
        <div className="summary-offcuts">
          <span>
            Se detectaron <strong>{offcutUnits}</strong> sobrante{offcutUnits === 1 ? '' : 's'} aprovechable
            {offcutUnits === 1 ? '' : 's'}
            {offcutUnits !== offcuts.length && ` en ${offcuts.length} medidas`} (≥ 2 % del tablero).
          </span>
          <button
            type="button"
            className="btn-offcuts"
            onClick={handleSaveOffcuts}
            disabled={offcutsSaved}
          >
            {offcutsSaved ? 'Retazos agregados ✓' : 'Agregar retazos como tableros'}
          </button>
        </div>
      )}
    </div>
  )
}
