import { useRef, useState } from 'react'
import { BoardForm } from './BoardForm'
import { BoardList } from './BoardList'
import { PieceForm } from './PieceForm'
import { PieceList } from './PieceList'
import { SettingsPanel } from './SettingsPanel'
import type { Board, Piece, AppSettings, CutSolution } from '../../types'
import { guillotineCut } from '../../algorithms/guillotine'

interface Props {
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
  isOpen: boolean
  onAddBoard: (b: Omit<Board, 'id'>) => void
  onUpdateBoard: (id: string, u: Partial<Board>) => void
  onRemoveBoard: (id: string) => void
  onAddPiece: (p: Omit<Piece, 'id'>) => void
  onUpdatePiece: (id: string, u: Partial<Piece>) => void
  onRemovePiece: (id: string) => void
  onChangeSettings: (s: AppSettings) => void
  onSolutionReady: (s: CutSolution) => void
  onExport: () => void
  onImportFile: (file: File) => void
  onClose: () => void
}

type Tab = 'boards' | 'pieces' | 'settings'

export function Sidebar({
  boards, pieces, settings, isOpen,
  onAddBoard, onUpdateBoard, onRemoveBoard,
  onAddPiece, onUpdatePiece, onRemovePiece,
  onChangeSettings, onSolutionReady,
  onExport, onImportFile, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('boards')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleOptimize() {
    const solution = guillotineCut(boards, pieces, settings.bladeThickness)
    onSolutionReady(solution)
    onClose()
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImportFile(file)
    e.target.value = ''
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <h2>OptimizaCortes</h2>
        <button className="sidebar-close" onClick={onClose} aria-label="Cerrar menú">✕</button>
      </div>

      <nav className="tab-nav">
        <button className={tab === 'boards' ? 'active' : ''} onClick={() => setTab('boards')}>
          Tableros
        </button>
        <button className={tab === 'pieces' ? 'active' : ''} onClick={() => setTab('pieces')}>
          Piezas
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          Config
        </button>
      </nav>

      <div className="sidebar-content">
        {tab === 'boards' && (
          <>
            <BoardForm onAdd={onAddBoard} />
            <BoardList boards={boards} onRemove={onRemoveBoard} onUpdate={onUpdateBoard} />
          </>
        )}
        {tab === 'pieces' && (
          <>
            <PieceForm onAdd={onAddPiece} />
            <PieceList pieces={pieces} onRemove={onRemovePiece} onUpdate={onUpdatePiece} />
          </>
        )}
        {tab === 'settings' && (
          <SettingsPanel settings={settings} onChange={onChangeSettings} />
        )}
      </div>

      <div className="sidebar-footer">
        <button
          className="btn-optimize"
          onClick={handleOptimize}
          disabled={boards.length === 0 || pieces.length === 0}
        >
          Optimizar cortes
        </button>

        <div className="footer-project">
          <button className="btn-project" onClick={onExport}>
            Exportar JSON
          </button>
          <button className="btn-project" onClick={handleImportClick}>
            Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
    </aside>
  )
}
