import { useCutStore } from './store/cutStore'
import { Sidebar } from './components/Sidebar/Sidebar'
import { CutCanvas } from './components/Canvas/CutCanvas'
import { SummaryPanel } from './components/Canvas/SummaryPanel'
import './App.css'

export default function App() {
  const store = useCutStore()

  return (
    <div className="app-layout">
      <Sidebar
        boards={store.boards}
        pieces={store.pieces}
        settings={store.settings}
        onAddBoard={store.addBoard}
        onUpdateBoard={store.updateBoard}
        onRemoveBoard={store.removeBoard}
        onAddPiece={store.addPiece}
        onUpdatePiece={store.updatePiece}
        onRemovePiece={store.removePiece}
        onChangeSettings={store.setSettings}
        onSolutionReady={store.setSolution}
      />
      <main className="main-area">
        {store.solution && <SummaryPanel solution={store.solution} />}
        <CutCanvas results={store.solution?.results ?? []} />
      </main>
    </div>
  )
}
