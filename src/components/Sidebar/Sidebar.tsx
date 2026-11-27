import { useRef, useState } from 'react'
import { BoardForm } from './BoardForm'
import { BoardList } from './BoardList'
import { PieceForm } from './PieceForm'
import { PieceList } from './PieceList'
import { ProjectsPanel } from './ProjectsPanel'
import { SettingsPanel } from './SettingsPanel'
import type { Board, Piece, AppSettings, CutSolution } from '../../types'
import type { ProjectEntry } from '../../store/cutStore'
import { guillotineCut } from '../../algorithms/guillotine'
import { maxrectsCut } from '../../algorithms/maxrects'
import { cutOptionsFromSettings } from '../../algorithms/options'
import { activeBoards, activePieces } from '../../utils/active'

interface Props {
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
  projects: ProjectEntry[]
  isOpen: boolean
  onAddBoard: (b: Omit<Board, 'id'>) => void
  onUpdateBoard: (id: string, u: Partial<Board>) => void
  onRemoveBoard: (id: string) => void
  onAddPiece: (p: Omit<Piece, 'id'>) => void
  onUpdatePiece: (id: string, u: Partial<Piece>) => void
  onRemovePiece: (id: string) => void
  onReorderPiece: (fromIdx: number, toIdx: number) => void
  onChangeSettings: (s: AppSettings) => void
  onChangeUnit: (u: AppSettings['unit']) => void
  onSaveProject: (name: string) => string
  onOpenProject: (id: string) => void
  onDeleteProject: (id: string) => void
  onSolutionReady: (s: CutSolution) => void
  onExport: () => void
  onImportFile: (file: File) => void
  onExportCsv: () => void
  onImportCsvFile: (file: File) => void
  onClose: () => void
}

type Tab = 'boards' | 'pieces' | 'settings' | 'projects'

export function Sidebar({
  boards, pieces, settings, projects, isOpen,
  onAddBoard, onUpdateBoard, onRemoveBoard,
  onAddPiece, onUpdatePiece, onRemovePiece, onReorderPiece,
  onChangeSettings, onChangeUnit,
  onSaveProject, onOpenProject, onDeleteProject,
  onSolutionReady,
  onExport, onImportFile, onExportCsv, onImportCsvFile, onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>('boards')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  function handleOptimize() {
    // Solo los elementos habilitados participan; los deshabilitados se conservan.
    const usableBoards = activeBoards(boards)
    const usablePieces = activePieces(pieces)
    const options = cutOptionsFromSettings(settings)
    let solution: CutSolution

    if (settings.algorithm === 'guillotine') {
      solution = guillotineCut(usableBoards, usablePieces, options)
    } else if (settings.algorithm === 'maxrects') {
      solution = maxrectsCut(usableBoards, usablePieces, options)
    } else {
      // auto: run both and pick the one with higher efficiency
      // (en empate gana Guillotine, que además produce la secuencia de cortes)
      const g = guillotineCut(usableBoards, usablePieces, options)
      const m = maxrectsCut(usableBoards, usablePieces, options)
      solution = m.totalEfficiency > g.totalEfficiency ? m : g
    }

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

  function handleCsvClick() {
    csvInputRef.current?.click()
  }

  function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImportCsvFile(file)
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
        <button className={tab === 'projects' ? 'active' : ''} onClick={() => setTab('projects')}>
          Proyectos
        </button>
      </nav>

      <div className="sidebar-content">
        {tab === 'boards' && (
          <>
            <BoardForm key={settings.unit} unit={settings.unit} onAdd={onAddBoard} />
            <BoardList boards={boards} unit={settings.unit} onRemove={onRemoveBoard} onUpdate={onUpdateBoard} />
          </>
        )}
        {tab === 'pieces' && (
          <>
            <PieceForm key={settings.unit} unit={settings.unit} onAdd={onAddPiece} />
            <PieceList
              pieces={pieces}
              unit={settings.unit}
              onRemove={onRemovePiece}
              onUpdate={onUpdatePiece}
              onReorder={onReorderPiece}
            />
          </>
        )}
        {tab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onChange={onChangeSettings}
            onChangeUnit={onChangeUnit}
          />
        )}
        {tab === 'projects' && (
          <ProjectsPanel
            projects={projects}
            onSave={onSaveProject}
            onOpen={onOpenProject}
            onDelete={onDeleteProject}
          />
        )}
      </div>

      <div className="sidebar-footer">
        <button
          className="btn-optimize"
          onClick={handleOptimize}
          disabled={activeBoards(boards).length === 0 || activePieces(pieces).length === 0}
          title={
            activeBoards(boards).length === 0
              ? 'Habilita al menos un tablero'
              : activePieces(pieces).length === 0
                ? 'Habilita al menos una pieza'
                : undefined
          }
        >
          Optimizar cortes
        </button>

        <div className="footer-project">
          <button className="btn-project" onClick={onExport} title="Exportar proyecto JSON">
            Exp. JSON
          </button>
          <button className="btn-project" onClick={handleImportClick} title="Importar proyecto JSON">
            Imp. JSON
          </button>
          <button className="btn-project" onClick={onExportCsv} title="Exportar piezas CSV">
            Exp. CSV
          </button>
          <button className="btn-project" onClick={handleCsvClick} title="Importar piezas CSV">
            Imp. CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCsvChange}
          />
        </div>
      </div>
    </aside>
  )
}
