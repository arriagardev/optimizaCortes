import type { CutSolution } from '../../types'

interface Props {
  solution: CutSolution
}

export function SummaryPanel({ solution }: Props) {
  return (
    <div className="summary-panel">
      <h3>Resumen</h3>
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
