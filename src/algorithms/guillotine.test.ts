import { describe, it, expect } from 'vitest'
import { guillotineCut } from './guillotine'
import type { Board, Piece, PieceEdges } from '../types'

const board: Board = { id: 'b1', width: 1000, height: 500, material: 'MDF', quantity: 1, enabled: true }
const noEdges: PieceEdges = { top: false, right: false, bottom: false, left: false }

function piece(p: Partial<Piece> & { id: string }): Piece {
  return {
    width: 100,
    height: 100,
    label: p.id,
    quantity: 1,
    canRotate: false,
    edges: noEdges,
    enabled: true,
    ...p,
  }
}

describe('guillotineCut', () => {
  it('places a single piece that fits exactly', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 1000, height: 500, label: 'A' }),
    ]
    const result = guillotineCut([board], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(0)
    expect(result.results[0].efficiency).toBeCloseTo(1)
  })

  it('does not place a piece larger than the board', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 1200, height: 600, label: 'Big' }),
    ]
    const result = guillotineCut([board], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(0)
    expect(result.unplacedPieces).toHaveLength(1)
  })

  it('places multiple pieces and tracks efficiency', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 400, height: 500, label: 'A' }),
      piece({ id: 'p2', width: 400, height: 500, label: 'B' }),
    ]
    const result = guillotineCut([board], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(2)
    expect(result.results[0].efficiency).toBeGreaterThan(0)
  })

  it('rotates a piece to fit when canRotate is true', () => {
    const tallBoard: Board = { id: 'b2', width: 200, height: 600, material: 'MDF', quantity: 1, enabled: true }
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 600, height: 200, label: 'Rotatable', canRotate: true }),
    ]
    const result = guillotineCut([tallBoard], pieces, 0)
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.results[0].placedPieces[0].rotated).toBe(true)
  })

  it('accounts for blade thickness when packing', () => {
    const smallBoard: Board = { id: 'b3', width: 100, height: 100, material: 'MDF', quantity: 1, enabled: true }
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 50, height: 100, label: 'A' }),
      piece({ id: 'p2', width: 50, height: 100, label: 'B' }),
    ]
    // With blade=5, total needed = 50+5+50 = 105 > 100, only one should fit
    const result = guillotineCut([smallBoard], pieces, 5)
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(1)
  })

  it('gira los cantos junto con la pieza', () => {
    const tallBoard: Board = { id: 'b4', width: 200, height: 600, material: 'MDF', quantity: 1, enabled: true }
    const pieces: Piece[] = [
      piece({
        id: 'p1',
        width: 600,
        height: 200,
        canRotate: true,
        edges: { top: true, right: false, bottom: false, left: true },
      }),
    ]
    const placed = guillotineCut([tallBoard], pieces, 0).results[0].placedPieces[0]
    expect(placed.rotated).toBe(true)
    // Giro horario: sup → der, izq → sup
    expect(placed.edges).toEqual({ top: true, right: true, bottom: false, left: false })
  })

  it('suma la longitud de canto de todas las piezas colocadas', () => {
    const pieces: Piece[] = [
      piece({
        id: 'p1',
        width: 100,
        height: 50,
        quantity: 2,
        edges: { top: true, right: false, bottom: true, left: true },
      }),
    ]
    // 100 + 100 + 50 = 250 por pieza, 2 piezas = 500
    const result = guillotineCut([board], pieces, 0)
    expect(result.totalEdgeLength).toBeCloseTo(500)
    expect(result.results[0].edgeLength).toBeCloseTo(500)
  })

  it('respeta el orden de la lista en modo manual', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 300, height: 200, label: 'Pequeña' }),
      piece({ id: 'p2', width: 500, height: 400, label: 'Grande' }),
    ]

    const auto = guillotineCut([board], pieces, 0, 'area')
    expect(auto.results[0].placedPieces[0].pieceId).toBe('p2')

    const manual = guillotineCut([board], pieces, 0, 'manual')
    expect(manual.results[0].placedPieces[0].pieceId).toBe('p1')
  })

  it('genera la secuencia de cortes ordenada por profundidad', () => {
    const square: Board = { id: 'b5', width: 1000, height: 1000, material: 'MDF', quantity: 1, enabled: true }
    const pieces: Piece[] = ['p1', 'p2', 'p3', 'p4'].map(id =>
      piece({ id, width: 500, height: 500, label: id }),
    )

    const steps = guillotineCut([square], pieces, 0).results[0].cutSteps ?? []

    // Tablero → corte vertical; luego un horizontal en cada mitad
    expect(steps).toHaveLength(3)
    expect(steps.map(s => s.depth)).toEqual([0, 1, 1])
    expect(steps[0]).toMatchObject({ orientation: 'vertical', offset: 500, length: 1000 })
    expect(steps.slice(1).every(s => s.orientation === 'horizontal' && s.offset === 500)).toBe(true)
  })

  it('no genera cortes cuando la pieza llena el tablero', () => {
    const pieces: Piece[] = [piece({ id: 'p1', width: 1000, height: 500 })]
    expect(guillotineCut([board], pieces, 0).results[0].cutSteps).toEqual([])
  })
})
