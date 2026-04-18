import { useState, useCallback, useEffect } from 'react'
import type { Board, Piece, CutSolution, AppSettings } from '../types'

const STORAGE_KEY = 'optimizacortes-project'

interface StoredProject {
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

const DEFAULT_SETTINGS: AppSettings = { bladeThickness: 3, unit: 'mm' }
const DEFAULT_BOARDS: Board[] = [
  { id: 'b1', width: 2440, height: 1220, material: 'MDF', quantity: 1 },
]

function loadFromStorage(): StoredProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { boards: DEFAULT_BOARDS, pieces: [], settings: DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as StoredProject
    return {
      boards: Array.isArray(parsed.boards) && parsed.boards.length > 0 ? parsed.boards : DEFAULT_BOARDS,
      pieces: Array.isArray(parsed.pieces) ? parsed.pieces : [],
      settings: parsed.settings ?? DEFAULT_SETTINGS,
    }
  } catch {
    return { boards: DEFAULT_BOARDS, pieces: [], settings: DEFAULT_SETTINGS }
  }
}

function extractMaxNum(items: { id: string }[], prefix: string): number {
  return items.reduce((max, item) => {
    if (!item.id.startsWith(prefix)) return max
    const n = parseInt(item.id.slice(prefix.length), 10)
    return isNaN(n) ? max : Math.max(max, n)
  }, 0)
}

const initial = loadFromStorage()
let nextBoardId = extractMaxNum(initial.boards, 'b') + 1
let nextPieceId = extractMaxNum(initial.pieces, 'p') + 1

export function useCutStore() {
  const [boards, setBoards] = useState<Board[]>(initial.boards)
  const [pieces, setPieces] = useState<Piece[]>(initial.pieces)
  const [solution, setSolution] = useState<CutSolution | null>(null)
  const [settings, setSettings] = useState<AppSettings>(initial.settings)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, pieces, settings }))
  }, [boards, pieces, settings])

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

  const loadProject = useCallback((b: Board[], p: Piece[], s: AppSettings) => {
    setBoards(b)
    setPieces(p)
    setSettings(s)
    setSolution(null)
    nextBoardId = extractMaxNum(b, 'b') + 1
    nextPieceId = extractMaxNum(p, 'p') + 1
  }, [])

  return {
    boards,
    pieces,
    solution,
    settings,
    setSolution,
    setSettings,
    addBoard,
    updateBoard,
    removeBoard,
    addPiece,
    updatePiece,
    removePiece,
    loadProject,
  }
}
