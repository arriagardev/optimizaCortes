import { useState, useCallback, useEffect } from 'react'
import type { Board, Piece, CutSolution, AppSettings } from '../types'

const STORAGE_KEY = 'optimizaCortes_v1'
const MAX_HISTORY = 30

const DEFAULT_BOARDS: Board[] = [
  { id: 'b1', width: 2440, height: 1220, material: 'MDF', quantity: 1 },
]
const DEFAULT_SETTINGS: AppSettings = { bladeThickness: 3, unit: 'mm' }

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

function loadSaved(): SavedProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedProject
  } catch {
    return null
  }
}

let nextBoardId = 1
let nextPieceId = 1

function syncCounters(boards: Board[], pieces: Piece[]) {
  const bNums = boards.map(b => parseInt(b.id.slice(1)) || 0)
  const pNums = pieces.map(p => parseInt(p.id.slice(1)) || 0)
  nextBoardId = bNums.length > 0 ? Math.max(...bNums) + 1 : 1
  nextPieceId = pNums.length > 0 ? Math.max(...pNums) + 1 : 1
}

const saved = loadSaved()
syncCounters(saved?.boards ?? DEFAULT_BOARDS, saved?.pieces ?? [])

export function useCutStore() {
  const [boards, setBoards] = useState<Board[]>(saved?.boards ?? DEFAULT_BOARDS)
  const [pieces, setPieces] = useState<Piece[]>(saved?.pieces ?? [])
  const [solution, setSolution] = useState<CutSolution | null>(null)
  const [settings, setSettings] = useState<AppSettings>(saved?.settings ?? DEFAULT_SETTINGS)
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, pieces, settings }))
  }, [boards, pieces, settings])

  // Saves a snapshot of the given state before a destructive action
  function pushSnapshot(b: Board[], p: Piece[], s: AppSettings) {
    setPast(prev => [...prev.slice(-(MAX_HISTORY - 1)), { boards: b, pieces: p, settings: s }])
    setFuture([])
  }

  const loadProject = useCallback((newBoards: Board[], newPieces: Piece[], newSettings: AppSettings) => {
    pushSnapshot(boards, pieces, settings)
    syncCounters(newBoards, newPieces)
    setBoards(newBoards)
    setPieces(newPieces)
    setSettings(newSettings)
    setSolution(null)
  }, [boards, pieces, settings])

  const addBoard = useCallback((board: Omit<Board, 'id'>) => {
    pushSnapshot(boards, pieces, settings)
    setBoards(prev => [...prev, { ...board, id: `b${nextBoardId++}` }])
  }, [boards, pieces, settings])

  const updateBoard = useCallback((id: string, updates: Partial<Board>) => {
    setBoards(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const removeBoard = useCallback((id: string) => {
    pushSnapshot(boards, pieces, settings)
    setBoards(prev => prev.filter(b => b.id !== id))
  }, [boards, pieces, settings])

  const addPiece = useCallback((piece: Omit<Piece, 'id'>) => {
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => [...prev, { ...piece, id: `p${nextPieceId++}` }])
  }, [boards, pieces, settings])

  const updatePiece = useCallback((id: string, updates: Partial<Piece>) => {
    setPieces(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const removePiece = useCallback((id: string) => {
    pushSnapshot(boards, pieces, settings)
    setPieces(prev => prev.filter(p => p.id !== id))
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

  return {
    boards, pieces, solution, settings,
    setSolution, setSettings,
    addBoard, updateBoard, removeBoard,
    addPiece, updatePiece, removePiece,
    loadProject,
    undo, redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}
