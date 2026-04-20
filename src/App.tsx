import { useState } from 'react'
import { useCutStore } from './store/cutStore'
import { Sidebar } from './components/Sidebar/Sidebar'
import { CutCanvas } from './components/Canvas/CutCanvas'
import { SummaryPanel } from './components/Canvas/SummaryPanel'
import { exportProject, importProject } from './utils/projectFile'
import './App.css'

export default function App() {
  const store = useCutStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function handleExport() {
    exportProject(store.boards, store.pieces, store.settings)
  }

  function handleImportFile(file: File) {
    importProject(
      file,
      (boards, pieces, settings) => store.loadProject(boards, pieces, settings),
      msg => alert(msg),
    )
  }

  return (
    <div className="app-layout">
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <Sidebar
        boards={store.boards}
        pieces={store.pieces}
        settings={store.settings}
        isOpen={sidebarOpen}
        onAddBoard={store.addBoard}
        onUpdateBoard={store.updateBoard}
        onRemoveBoard={store.removeBoard}
        onAddPiece={store.addPiece}
        onUpdatePiece={store.updatePiece}
        onRemovePiece={store.removePiece}
        onChangeSettings={store.setSettings}
        onSolutionReady={store.setSolution}
        onExport={handleExport}
        onImportFile={handleImportFile}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-area">
        <div className="mobile-topbar">
          <button className="btn-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            ☰
          </button>
          <span className="mobile-title">OptimizaCortes</span>
        </div>

        {store.solution && (
          <SummaryPanel
            solution={store.solution}
            boards={store.boards}
            pieces={store.pieces}
            settings={store.settings}
          />
        )}
        <CutCanvas results={store.solution?.results ?? []} />
      </main>
    </div>
  )
}
