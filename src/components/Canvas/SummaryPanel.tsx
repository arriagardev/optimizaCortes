import type { Board, Piece, CutSolution, AppSettings } from '../../types'
import { generatePdf } from '../../utils/generatePdf'
import { unplacedSummary } from '../../utils/edges'

interface Props {
  solution: CutSolution
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

export function SummaryPanel({ solution, boards, pieces, settings }: Props) {
  const placed = solution.results.flatMap(r => r.placedPieces)
  const wasteArea = solution.results.reduce((sum, r) => sum + (r.totalArea - r.usedArea), 0) / 1_000_000
  const missing = unplacedSummary(pieces, placed)
  const missingUnits = missing.reduce((sum, row) => sum + row.missing, 0)

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
          <span className="stat-value">{(solution.totalEdgeLength / 1000).toFixed(2)}<small> m</small></span>
          <span className="stat-label">Canto lineales</span>
        </div>
        <div className="stat">
          <span className="stat-value">{wasteArea.toFixed(2)}<small> m²</small></span>
          <span className="stat-label">Desperdicio</span>
        </div>
      </div>
      {missing.length > 0 && (
        <div className="unplaced-warning">
          <strong>Piezas sin colocar:</strong>{' '}
          {missing.map(row => `${row.piece.label} ×${row.missing}`).join(', ')}
        </div>
      )}
    </div>
  )
}
