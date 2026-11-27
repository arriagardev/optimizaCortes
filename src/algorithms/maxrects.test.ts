import { describe, it, expect } from 'vitest'
import { maxrectsCut } from './maxrects'
import type { Board, Piece, PieceEdges } from '../types'

const noEdges: PieceEdges = { top: false, right: false, bottom: false, left: false }

function boardOf(overrides: Partial<Board> & { id: string }): Board {
  return {
    width: 1000,
    height: 500,
    material: 'MDF',
    quantity: 1,
    grain: 'none',
    trim: 0,
    enabled: true,
    ...overrides,
  }
}

function piece(overrides: Partial<Piece> & { id: string }): Piece {
  return {
    width: 100,
    height: 100,
    label: overrides.id,
    quantity: 1,
    canRotate: false,
    edges: noEdges,
    grain: false,
    enabled: true,
    ...overrides,
  }
}

describe('maxrectsCut', () => {
  it('llena el tablero con piezas exactas', () => {
    const board = boardOf({ id: 'b1' })
    const pieces = [
      piece({ id: 'p1', width: 500, height: 500 }),
      piece({ id: 'p2', width: 500, height: 500 }),
    ]
    const result = maxrectsCut([board], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.results[0].placedPieces).toHaveLength(2)
    expect(result.results[0].efficiency).toBeCloseTo(1)
    expect(result.unplacedPieces).toHaveLength(0)
  })

  it('respeta el kerf independiente por eje', () => {
    const board = boardOf({ id: 'b2', width: 100, height: 100 })
    const pieces = [
      piece({ id: 'p1', width: 50, height: 100 }),
      piece({ id: 'p2', width: 50, height: 100 }),
    ]
    expect(maxrectsCut([board], pieces, { kerfX: 0, kerfY: 0 }).results[0].placedPieces).toHaveLength(2)
    expect(maxrectsCut([board], pieces, { kerfX: 5, kerfY: 0 }).results[0].placedPieces).toHaveLength(1)
  })

  it('descuenta el refile del área útil', () => {
    const board = boardOf({ id: 'b3', width: 100, height: 100, trim: 10 })
    expect(maxrectsCut([board], [piece({ id: 'big', width: 90, height: 90 })], { kerfX: 0, kerfY: 0 }).unplacedPieces).toHaveLength(1)
    const exact = maxrectsCut([board], [piece({ id: 'fit', width: 80, height: 80 })], { kerfX: 0, kerfY: 0 })
    expect(exact.unplacedPieces).toHaveLength(0)
    expect(exact.results[0].placedPieces[0]).toMatchObject({ x: 10, y: 10 })
  })

  it('obliga la orientación de la veta', () => {
    const board = boardOf({ id: 'b4', width: 500, height: 500, grain: 'height' })
    const pieces = [piece({ id: 'p1', width: 400, height: 200, grain: true })]
    const placed = maxrectsCut([board], pieces, { kerfX: 0, kerfY: 0 }).results[0].placedPieces[0]
    expect(placed.rotated).toBe(true)
    expect(placed.width).toBe(200)
    expect(placed.height).toBe(400)
  })

  it('numera las piezas y no genera secuencia guillotina', () => {
    const board = boardOf({ id: 'b5' })
    const pieces = [
      piece({ id: 'p1', width: 300, height: 200 }),
      piece({ id: 'p2', width: 200, height: 200 }),
    ]
    const result = maxrectsCut([board], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.results[0].placedPieces.map(p => p.step)).toEqual([1, 2])
    expect(result.results[0].cutSteps).toBeUndefined()
    expect(result.algorithmUsed).toBe('maxrects')
  })
})
