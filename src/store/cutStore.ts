import { useState, useCallback } from 'react'
import type { Board, Piece, CutSolution, AppSettings } from '../types'

let nextBoardId = 1
let nextPieceId = 1

export function useCutStore() {
  const [boards, setBoards] = useState<Board[]>([
    { id: 'b1', width: 2440, height: 1220, material: 'MDF', quantity: 1 },
  ])
  const [pieces, setPieces] = useState<Piece[]>([])
  const [solution, setSolution] = useState<CutSolution | null>(null)
  const [settings, setSettings] = useState<AppSettings>({
    bladeThickness: 3,
    unit: 'mm',
  })

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
  }
}
