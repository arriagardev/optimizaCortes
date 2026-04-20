import type { Board, Piece, CutSolution, AppSettings } from '../../types'
import { generatePdf } from '../../utils/generatePdf'

interface Props {
  solution: CutSolution
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

export function SummaryPanel({ solution, boards, pieces, settings }: Props) {
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
          <span className="stat-value">{solution.unplacedPieces.length}</span>
          <span className="stat-label">Piezas sin colocar</span>
        </div>
      </div>
      {solution.unplacedPieces.length > 0 && (
        <div className="unplaced-warning">
          <strong>Piezas sin colocar:</strong>{' '}
          {solution.unplacedPieces.map(p => p.label).join(', ')}
        </div>
      )}
    </div>
  )
}
