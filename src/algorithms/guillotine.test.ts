import { describe, it, expect } from 'vitest'
import { guillotineCut } from './guillotine'
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

function piece(p: Partial<Piece> & { id: string }): Piece {
  return {
    width: 100,
    height: 100,
    label: p.id,
    quantity: 1,
    canRotate: false,
    edges: noEdges,
    grain: false,
    enabled: true,
    ...p,
  }
}

const board = boardOf({ id: 'b1' })

describe('guillotineCut', () => {
  it('places a single piece that fits exactly', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 1000, height: 500, label: 'A' }),
    ]
    const result = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(0)
    expect(result.results[0].efficiency).toBeCloseTo(1)
  })

  it('does not place a piece larger than the board', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 1200, height: 600, label: 'Big' }),
    ]
    const result = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.results[0].placedPieces).toHaveLength(0)
    expect(result.unplacedPieces).toHaveLength(1)
  })

  it('places multiple pieces and tracks efficiency', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 400, height: 500, label: 'A' }),
      piece({ id: 'p2', width: 400, height: 500, label: 'B' }),
    ]
    const result = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.results[0].placedPieces).toHaveLength(2)
    expect(result.results[0].efficiency).toBeGreaterThan(0)
  })

  it('rotates a piece to fit when canRotate is true', () => {
    const tallBoard = boardOf({ id: 'b2', width: 200, height: 600 })
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 600, height: 200, label: 'Rotatable', canRotate: true }),
    ]
    const result = guillotineCut([tallBoard], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.results[0].placedPieces[0].rotated).toBe(true)
  })

  it('descuenta el kerf al empacar', () => {
    const smallBoard = boardOf({ id: 'b3', width: 100, height: 100 })
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 50, height: 100, label: 'A' }),
      piece({ id: 'p2', width: 50, height: 100, label: 'B' }),
    ]
    // kerf 5 → 50+5+50 = 105 > 100: solo cabe una
    const result = guillotineCut([smallBoard], pieces, { kerfX: 5, kerfY: 5 })
    expect(result.results[0].placedPieces).toHaveLength(1)
    expect(result.unplacedPieces).toHaveLength(1)
  })

  it('permite un kerf distinto en cada eje', () => {
    const smallBoard = boardOf({ id: 'b-kerf', width: 100, height: 100 })
    const sideBySide: Piece[] = [
      piece({ id: 'p1', width: 50, height: 100 }),
      piece({ id: 'p2', width: 50, height: 100 }),
    ]

    // Sin kerf horizontal caben las dos; con kerf X de 5 solo una.
    expect(guillotineCut([smallBoard], sideBySide, { kerfX: 0, kerfY: 0 }).results[0].placedPieces).toHaveLength(2)
    expect(guillotineCut([smallBoard], sideBySide, { kerfX: 5, kerfY: 0 }).results[0].placedPieces).toHaveLength(1)

    const stacked: Piece[] = [
      piece({ id: 'p1', width: 100, height: 50 }),
      piece({ id: 'p2', width: 100, height: 50 }),
    ]
    expect(guillotineCut([smallBoard], stacked, { kerfX: 0, kerfY: 0 }).results[0].placedPieces).toHaveLength(2)
    expect(guillotineCut([smallBoard], stacked, { kerfX: 0, kerfY: 5 }).results[0].placedPieces).toHaveLength(1)
  })

  it('descuenta el refile del área útil del tablero', () => {
    const trimmed = boardOf({ id: 'b-trim', width: 100, height: 100, trim: 10 })
    expect(guillotineCut([trimmed], [piece({ id: 'big', width: 90, height: 90 })], { kerfX: 0, kerfY: 0 }).unplacedPieces).toHaveLength(1)

    const exact = guillotineCut([trimmed], [piece({ id: 'fit', width: 80, height: 80 })], { kerfX: 0, kerfY: 0 })
    expect(exact.unplacedPieces).toHaveLength(0)
    expect(exact.results[0].placedPieces[0]).toMatchObject({ x: 10, y: 10 })
    expect(exact.results[0].efficiency).toBeCloseTo(1)
  })

  it('alinea la veta de la pieza con la veta horizontal del tablero', () => {
    const grained = boardOf({ id: 'b-grain-w', grain: 'width' })
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 400, height: 200, canRotate: true, grain: true }),
    ]
    const placed = guillotineCut([grained], pieces, { kerfX: 0, kerfY: 0 }).results[0].placedPieces[0]
    expect(placed.rotated).toBe(false)
    expect(placed.width).toBe(400)
    expect(placed.height).toBe(200)
  })

  it('gira la pieza para alinear la veta vertical del tablero', () => {
    const grained = boardOf({ id: 'b-grain-h', grain: 'height', width: 500, height: 500 })
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 400, height: 200, canRotate: false, grain: true }),
    ]
    const placed = guillotineCut([grained], pieces, { kerfX: 0, kerfY: 0 }).results[0].placedPieces[0]
    expect(placed.rotated).toBe(true)
    expect(placed.width).toBe(200)
    expect(placed.height).toBe(400)
  })

  it('numera las piezas colocadas por tablero', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 300, height: 200 }),
      piece({ id: 'p2', width: 200, height: 200 }),
    ]
    const placed = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0 }).results[0].placedPieces
    expect(placed.map(p => p.step)).toEqual([1, 2])
  })

  it('gira los cantos junto con la pieza', () => {
    const tallBoard = boardOf({ id: 'b4', width: 200, height: 600 })
    const pieces: Piece[] = [
      piece({
        id: 'p1',
        width: 600,
        height: 200,
        canRotate: true,
        edges: { top: true, right: false, bottom: false, left: true },
      }),
    ]
    const placed = guillotineCut([tallBoard], pieces, { kerfX: 0, kerfY: 0 }).results[0].placedPieces[0]
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
    const result = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0 })
    expect(result.totalEdgeLength).toBeCloseTo(500)
    expect(result.results[0].edgeLength).toBeCloseTo(500)
  })

  it('respeta el orden de la lista en modo manual', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', width: 300, height: 200, label: 'Pequeña' }),
      piece({ id: 'p2', width: 500, height: 400, label: 'Grande' }),
    ]

    const auto = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0, pieceOrder: 'area' })
    expect(auto.results[0].placedPieces[0].pieceId).toBe('p2')

    const manual = guillotineCut([board], pieces, { kerfX: 0, kerfY: 0, pieceOrder: 'manual' })
    expect(manual.results[0].placedPieces[0].pieceId).toBe('p1')
  })

  it('genera la secuencia de cortes ordenada por profundidad', () => {
    const square = boardOf({ id: 'b5', width: 1000, height: 1000 })
    const pieces: Piece[] = ['p1', 'p2', 'p3', 'p4'].map(id =>
      piece({ id, width: 500, height: 500, label: id }),
    )

    const steps = guillotineCut([square], pieces, { kerfX: 0, kerfY: 0 }).results[0].cutSteps ?? []

    // Tablero → corte vertical; luego un horizontal en cada mitad
    expect(steps).toHaveLength(3)
    expect(steps.map(s => s.depth)).toEqual([0, 1, 1])
    expect(steps[0]).toMatchObject({ orientation: 'vertical', offset: 500, length: 1000 })
    expect(steps.slice(1).every(s => s.orientation === 'horizontal' && s.offset === 500)).toBe(true)
  })

  it('no genera cortes cuando la pieza llena el tablero', () => {
    const pieces: Piece[] = [piece({ id: 'p1', width: 1000, height: 500 })]
    expect(guillotineCut([board], pieces, { kerfX: 0, kerfY: 0 }).results[0].cutSteps).toEqual([])
  })

  it('compensa el espesor del canto en la dimensión de corte', () => {
    const smallBoard = boardOf({ id: 'b-edge', width: 100, height: 100 })
    const pieces: Piece[] = [
      piece({
        id: 'p1',
        width: 102,
        height: 100,
        edges: { top: false, right: false, bottom: false, left: true },
      }),
    ]

    const resWithout = guillotineCut([smallBoard], pieces, { kerfX: 0, kerfY: 0, edgeThickness: 0 })
    expect(resWithout.results[0].placedPieces).toHaveLength(0)

    const resWith = guillotineCut([smallBoard], pieces, { kerfX: 0, kerfY: 0, edgeThickness: 3 })
    expect(resWith.results[0].placedPieces).toHaveLength(1)
    expect(resWith.results[0].placedPieces[0].width).toBe(99)
  })
})
