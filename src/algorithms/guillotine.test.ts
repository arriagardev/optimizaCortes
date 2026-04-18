import { describe, it, expect } from 'vitest'
import { guillotineCut } from './guillotine'
import type { Board, Piece } from '../types'

const board: Board = { id: 'b1', width: 1000, height: 500, material: 'MDF', quantity: 1 }

describe('guillotineCut', () => {
  it('places a single piece that fits exactly', () => {
    const pieces: Piece[] = [
      { id: 'p1', width: 1000, height: 500, label: 'A', quantity: 1, canRotate: false },
    ]
    const result = guillotineCut([board], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(0)
    expect(result.results[0].efficiency).toBeCloseTo(1)
  })

  it('does not place a piece larger than the board', () => {
    const pieces: Piece[] = [
      { id: 'p1', width: 1200, height: 600, label: 'Big', quantity: 1, canRotate: false },
    ]
    const result = guillotineCut([board], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(0)
    expect(result.unplacedPieces).toHaveLength(1)
  })

  it('places multiple pieces and tracks efficiency', () => {
    const pieces: Piece[] = [
      { id: 'p1', width: 400, height: 500, label: 'A', quantity: 1, canRotate: false },
      { id: 'p2', width: 400, height: 500, label: 'B', quantity: 1, canRotate: false },
    ]
    const result = guillotineCut([board], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(2)
    expect(result.results[0].efficiency).toBeGreaterThan(0)
  })

  it('rotates a piece to fit when canRotate is true', () => {
    const tallBoard: Board = { id: 'b2', width: 200, height: 600, material: 'MDF', quantity: 1 }
    const pieces: Piece[] = [
      { id: 'p1', width: 600, height: 200, label: 'Rotatable', quantity: 1, canRotate: true },
    ]
    const result = guillotineCut([tallBoard], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.results[0].placedPieces[0].rotated).toBe(true)
  })

  it('accounts for blade thickness when packing', () => {
    const smallBoard: Board = { id: 'b3', width: 100, height: 100, material: 'MDF', quantity: 1 }
    const pieces: Piece[] = [
      { id: 'p1', width: 50, height: 100, label: 'A', quantity: 1, canRotate: false },
      { id: 'p2', width: 50, height: 100, label: 'B', quantity: 1, canRotate: false },
    ]
    // With blade=5, total needed = 50+5+50 = 105 > 100, only one should fit
    const result = guillotineCut([smallBoard], pieces, 5)
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(1)
  })
})
