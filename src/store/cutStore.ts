import { useState, useCallback, useEffect } from 'react'
import type { Board, Piece, CutSolution, AppSettings } from '../types'
import { normalizeEdges, normalizePieces } from '../utils/edges'
import { normalizeBoards } from '../utils/active'
import { convertValue } from '../utils/units'

const STORAGE_KEY = 'optimizaCortes_v1'
const PROJECTS_KEY = 'optimizaCortes_projects_v1'
const MAX_HISTORY = 30

const DEFAULT_SETTINGS: AppSettings = {
  kerfX: 3,
  kerfY: 3,
  edgeThickness: 0,
  unit: 'mm',
  algorithm: 'auto',
  pieceOrder: 'area',
  boardCostPerM2: 0,
  edgeCostPerMeter: 0,
  currency: 'MXN',
  pdfSequenceOrder: 'end',
}
const DEFAULT_BOARDS: Board[] = [
  { id: 'b1', width: 2440, height: 1220, material: 'MDF', quantity: 1, grain: 'none', trim: 0, enabled: true },
]

interface SavedProject {
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

interface Snapshot {
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

/** Proyecto guardado en la biblioteca local (independiente del proyecto activo). */
export interface ProjectEntry {
  id: string
  name: string
  savedAt: number
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

type LegacySettings = Partial<AppSettings> & { bladeThickness?: number }

/** Completa ajustes viejos: `bladeThickness` pasa a ser el kerf en ambos ejes. */
function normalizeSettings(raw?: LegacySettings | null): AppSettings {
  const legacyKerf = typeof raw?.bladeThickness === 'number' ? raw.bladeThickness : undefined
  const kerfX = typeof raw?.kerfX === 'number' && raw.kerfX >= 0 ? raw.kerfX : (legacyKerf ?? DEFAULT_SETTINGS.kerfX)
  const kerfY = typeof raw?.kerfY === 'number' && raw.kerfY >= 0 ? raw.kerfY : (legacyKerf ?? kerfX)
  const edgeThickness = typeof raw?.edgeThickness === 'number' && raw.edgeThickness >= 0 ? raw.edgeThickness : 0

  return {
    kerfX,
    kerfY,
    edgeThickness,
    unit: raw?.unit === 'cm' || raw?.unit === 'in' ? raw.unit : 'mm',
    algorithm:
      raw?.algorithm === 'guillotine' || raw?.algorithm === 'maxrects' ? raw.algorithm : 'auto',
    pieceOrder: raw?.pieceOrder === 'manual' ? 'manual' : 'area',
    boardCostPerM2: Number.isFinite(raw?.boardCostPerM2) ? Math.max(0, raw!.boardCostPerM2!) : 0,
    edgeCostPerMeter: Number.isFinite(raw?.edgeCostPerMeter) ? Math.max(0, raw!.edgeCostPerMeter!) : 0,
    currency:
      raw?.currency === 'USD' || raw?.currency === 'EUR' ? raw.currency : 'MXN',
    pdfSequenceOrder: raw?.pdfSequenceOrder === 'board' ? 'board' : 'end',
  }
}

function loadSaved(): SavedProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedProject
  } catch {
    return null
  }
}

function loadProjects(): ProjectEntry[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY)
    if (!raw) return []
    const list = JSON.parse(raw) as ProjectEntry[]
    if (!Array.isArray(list)) return []
    return list
      .filter(entry => entry && Array.isArray(entry.boards) && Array.isArray(entry.pieces))
      .map(entry => ({
        id: String(entry.id),
        name: String(entry.name || 'Proyecto'),
        savedAt: Number(entry.savedAt) || Date.now(),
        boards: normalizeBoards(entry.boards),
        pieces: normalizePieces(entry.pieces),
        settings: normalizeSettings(entry.settings),
      }))
  } catch {
    return []
  }
}

let nextBoardId = 1
let nextPieceId = 1
let projectCounter = 0

function syncCounters(boards: Board[], pieces: Piece[]) {
  const bNums = boards.map(b => parseInt(b.id.slice(1)) || 0)
  const pNums = pieces.map(p => parseInt(p.id.slice(1)) || 0)
  nextBoardId = bNums.length > 0 ? Math.max(...bNums) + 1 : 1
  nextPieceId = pNums.length > 0 ? Math.max(...pNums) + 1 : 1
}

const saved = loadSaved()
const initialBoards = normalizeBoards(saved?.boards ?? DEFAULT_BOARDS)
// Normaliza piezas guardadas con versiones anteriores (sin canteado / sin habilitado).
const initialPieces = normalizePieces(saved?.pieces ?? [])
syncCounters(initialBoards, initialPieces)

export function useCutStore() {
  const [boards, setBoards] = useState<Board[]>(initialBoards)
  const [pieces, setPieces] = useState<Piece[]>(initialPieces)
  const [solution, setSolution] = useState<CutSolution | null>(null)
  const [settings, setSettings] = useState<AppSettings>(() => normalizeSettings(saved?.settings))
  const [projects, setProjects] = useState<ProjectEntry[]>(loadProjects)
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, pieces, settings }))
  }, [boards, pieces, settings])

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  }, [projects])

  function pushSnapshot(b: Board[], p: Piece[], s: AppSettings) {
    setPast(prev => [...prev.slice(-(MAX_HISTORY - 1)), { boards: b, pieces: p, settings: s }])
    setFuture([])
  }

  const loadProject = useCallback((newBoards: Board[], newPieces: Piece[], newSettings: AppSettings) => {
    pushSnapshot(boards, pieces, settings)
    const normalizedBoards = normalizeBoards(newBoards)
    const normalizedPieces = normalizePieces(newPieces)
    syncCounters(normalizedBoards, normalizedPieces)
    setBoards(normalizedBoards)
    setPieces(normalizedPieces)
    // Normaliza ajustes de archivos viejos (bladeThickness → kerfX/kerfY).
    setSettings(normalizeSettings(newSettings))
    setSolution(null)
  }, [boards, pieces, settings])

  const addBoards = useCallback((newBoards: Omit<Board, 'id'>[]) => {
    if (newBoards.length === 0) return
    pushSnapshot(boards, pieces, settings)
    setBoards(prev => [
      ...prev,
      ...newBoards.map(board => ({ ...board, id: `b${nextBoardId++}` })),
    ])
    setSolution(null)
  }, [boards, pieces, settings])

  const addBoard = useCallback((board: Omit<Board, 'id'>) => {
    addBoards([board])
  }, [addBoards])

  const updateBoard = useCallback((id: string, updates: Partial<Board>) => {
    pushSnapshot(boards, pieces, settings)
    setBoards(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)))
    setSolution(null)
  }, [boards, pieces, settings])

  const removeBoard = useCallback((id: string) => {
    pushSnapshot(boards, pieces, settings)
    setBoards(prev => prev.filter(b => b.id !== id))
    setSolution(null)
  }, [boards, pieces, settings])

  const addPiece = useCallback((piece: Omit<Piece, 'id'>) => {
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => [...prev, { ...piece, edges: normalizeEdges(piece.edges), id: `p${nextPieceId++}` }])
    setSolution(null)
  }, [boards, pieces, settings])

  const addPieces = useCallback((newPieces: Omit<Piece, 'id'>[]) => {
    if (newPieces.length === 0) return
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => [
      ...prev,
      ...newPieces.map(p => ({ ...p, edges: normalizeEdges(p.edges), id: `p${nextPieceId++}` })),
    ])
    setSolution(null)
  }, [boards, pieces, settings])

  const updatePiece = useCallback((id: string, updates: Partial<Piece>) => {
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)))
    setSolution(null)
  }, [boards, pieces, settings])

  const removePiece = useCallback((id: string) => {
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => prev.filter(p => p.id !== id))
    setSolution(null)
  }, [boards, pieces, settings])

  const reorderPieces = useCallback((fromIdx: number, toIdx: number) => {
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
    setSolution(null)
  }, [boards, pieces, settings])

  /** Cambia la unidad de medida convirtiendo tableros, piezas, refile y cuchilla. */
  const changeUnit = useCallback((unit: AppSettings['unit']) => {
    if (unit === settings.unit) return
    pushSnapshot(boards, pieces, settings)
    const from = settings.unit
    const dim = (value: number) => convertValue(value, from, unit, 2)
    setBoards(prev => prev.map(b => ({ ...b, width: dim(b.width), height: dim(b.height), trim: dim(b.trim || 0) })))
    setPieces(prev => prev.map(p => ({ ...p, width: dim(p.width), height: dim(p.height) })))
    setSettings(prev => ({
      ...prev,
      unit,
      kerfX: convertValue(prev.kerfX, from, unit, 4),
      kerfY: convertValue(prev.kerfY, from, unit, 4),
    }))
    setSolution(null)
  }, [boards, pieces, settings])

  const undo = useCallback(() => {
    if (past.length === 0) return
    const snap = past[past.length - 1]
    setPast(prev => prev.slice(0, -1))
    setFuture(prev => [{ boards, pieces, settings }, ...prev].slice(0, MAX_HISTORY))
    syncCounters(snap.boards, snap.pieces)
    setBoards(snap.boards)
    setPieces(snap.pieces)
    setSettings(snap.settings)
    setSolution(null)
  }, [past, boards, pieces, settings])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const snap = future[0]
    setFuture(prev => prev.slice(1))
    setPast(prev => [...prev, { boards, pieces, settings }].slice(-MAX_HISTORY))
    syncCounters(snap.boards, snap.pieces)
    setBoards(snap.boards)
    setPieces(snap.pieces)
    setSettings(snap.settings)
    setSolution(null)
  }, [future, boards, pieces, settings])

  /** Guarda una copia del proyecto activo en la biblioteca local. */
  const saveProject = useCallback((name: string) => {
    const trimmed = name.trim() || `Proyecto ${projects.length + 1}`
    const entry: ProjectEntry = {
      id: `prj_${Date.now()}_${projectCounter++}`,
      name: trimmed,
      savedAt: Date.now(),
      boards: normalizeBoards(boards),
      pieces: normalizePieces(pieces),
      settings: { ...settings },
    }
    setProjects(prev => [entry, ...prev])
    return entry.id
  }, [boards, pieces, settings, projects.length])

  const openProject = useCallback((id: string) => {
    const entry = projects.find(project => project.id === id)
    if (!entry) return
    loadProject(entry.boards, entry.pieces, entry.settings)
  }, [projects, loadProject])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id))
  }, [])

  return {
    boards, pieces, solution, settings, projects,
    setSolution, setSettings,
    addBoard, addBoards, updateBoard, removeBoard,
    addPiece, addPieces, updatePiece, removePiece,
    reorderPieces, loadProject, changeUnit,
    saveProject, openProject, deleteProject,
    undo, redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
