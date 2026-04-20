import { useState, useCallback, useEffect } from 'react'
import type { Board, Piece, CutSolution, AppSettings } from '../types'

const STORAGE_KEY = 'optimizaCortes_v1'

const DEFAULT_BOARDS: Board[] = [
  { id: 'b1', width: 2440, height: 1220, material: 'MDF', quantity: 1 },
]
const DEFAULT_SETTINGS: AppSettings = { bladeThickness: 3, unit: 'mm' }

interface SavedProject {
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

// Initialize counters from saved or default data on module load
const saved = loadSaved()
syncCounters(saved?.boards ?? DEFAULT_BOARDS, saved?.pieces ?? [])

export function useCutStore() {
  const [boards, setBoards] = useState<Board[]>(saved?.boards ?? DEFAULT_BOARDS)
  const [pieces, setPieces] = useState<Piece[]>(saved?.pieces ?? [])
  const [solution, setSolution] = useState<CutSolution | null>(null)
  const [settings, setSettings] = useState<AppSettings>(saved?.settings ?? DEFAULT_SETTINGS)

  // Persist to localStorage on every relevant change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, pieces, settings }))
  }, [boards, pieces, settings])

  const loadProject = useCallback((newBoards: Board[], newPieces: Piece[], newSettings: AppSettings) => {
    syncCounters(newBoards, newPieces)
    setBoards(newBoards)
    setPieces(newPieces)
    setSettings(newSettings)
    setSolution(null)
  }, [])

  const addBoard = useCallback((board: Omit<Board, 'id'>) => {
    setBoards(prev => [...prev, { ...board, id: `b${nextBoardId++}` }])
  }, [])

  const updateBoard = useCallback((id: string, updates: Partial<Board>) => {
    setBoards(prev => prev.map(b => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const removeBoard = useCallback((id: string) => {
    setBoards(prev => prev.filter(b => b.id !== id))
  }, [])

  const addPiece = useCallback((piece: Omit<Piece, 'id'>) => {
    setPieces(prev => [...prev, { ...piece, id: `p${nextPieceId++}` }])
  }, [])

  const updatePiece = useCallback((id: string, updates: Partial<Piece>) => {
    setPieces(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)))
  }, [])

  const removePiece = useCallback((id: string) => {
    setPieces(prev => prev.filter(p => p.id !== id))
  }, [])

  return {
    boards, pieces, solution, settings,
    setSolution, setSettings,
    addBoard, updateBoard, removeBoard,
    addPiece, updatePiece, removePiece,
    loadProject,
  }
}
