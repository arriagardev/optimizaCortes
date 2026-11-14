import type { Board, Piece, CutSolution, AppSettings } from '../../types'
import { generatePdf } from '../../utils/generatePdf'
import { unplacedSummary } from '../../utils/edges'
import { activePieces } from '../../utils/active'
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
}

export function SummaryPanel({ solution, boards, pieces, settings }: Props) {
  const unit = settings.unit
  const placed = solution.results.flatMap(r => r.placedPieces)
  const wasteArea = areaToM2(solution.results.reduce((sum, r) => sum + (r.totalArea - r.usedArea), 0), unit)
  const edgeMeters = lengthToMeters(solution.totalEdgeLength, unit)
  const missing = unplacedSummary(activePieces(pieces), placed)
  const missingUnits = missing.reduce((sum, row) => sum + row.missing, 0)

  const boardAreaM2 = areaToM2(solution.results.reduce((sum, r) => sum + r.totalArea, 0), unit)
  const boardCost = boardAreaM2 * (settings.boardCostPerM2 || 0)
  const edgeCost = edgeMeters * (settings.edgeCostPerMeter || 0)
  const totalCost = boardCost + edgeCost
  const showCosts = settings.boardCostPerM2 > 0 || settings.edgeCostPerMeter > 0

  function handleExportPdf() {
    generatePdf(boards, pieces, solution, settings)
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
        <button className="btn-pdf" onClick={handleExportPdf}>
          Exportar PDF
        </button>
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
          Canto ({formatMeters(edgeMeters)}): <strong>{formatMoney(edgeCost, settings.currency)}</strong>
        </p>
      )}
      {missing.length > 0 && (
        <div className="unplaced-warning">
          <strong>Piezas sin colocar:</strong>{' '}
          {missing.map(row => `${row.piece.label} ×${row.missing}`).join(', ')}
        </div>
      )}
    </div>
  )
}
