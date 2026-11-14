import { describe, it, expect } from 'vitest'
import type { Board, Piece } from '../types'
import { activeBoards, activePieces, normalizeBoards } from './active'

const board = (enabled?: boolean): Board =>
  ({ id: 'b1', width: 1000, height: 500, material: 'MDF', quantity: 1, enabled } as Board)

const piece = (id: string, enabled?: boolean): Piece =>
  ({
    id,
    width: 300,
    height: 200,
    label: id,
    quantity: 1,
    canRotate: true,
    edges: { top: false, right: false, bottom: false, left: false },
    enabled,
  } as Piece)

describe('elementos habilitados', () => {
  it('normaliza tableros viejos como habilitados', () => {
    expect(normalizeBoards([board(undefined)]).every(b => b.enabled)).toBe(true)
    expect(normalizeBoards([board(false)])[0].enabled).toBe(false)
  })

  it('solo devuelve los tableros y piezas habilitados', () => {
    const boards = [board(true), board(false)]
    const pieces = [piece('p1', true), piece('p2', false)]

    expect(activeBoards(boards).map(b => b.id)).toEqual(['b1'])
    expect(activePieces(pieces).map(p => p.id)).toEqual(['p1'])
  })

  it('considera habilitadas las piezas sin el campo (datos viejos)', () => {
    expect(activePieces([piece('p1', undefined)])).toHaveLength(1)
  })
})
