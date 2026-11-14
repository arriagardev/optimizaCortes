import { describe, it, expect } from 'vitest'
import type { Piece, PlacedPiece } from '../types'
import {
  countEdges,
  edgesLabel,
  edgesSignature,
  normalizeEdges,
  pieceEdgeLength,
  placedEdgeLength,
  rotateEdges,
  summarizeEdgeBanding,
  unplacedSummary,
} from './edges'

const allFalse = { top: false, right: false, bottom: false, left: false }

function piece(p: Partial<Piece> & { id: string }): Piece {
  return {
    width: 600,
    height: 400,
    label: p.id,
    quantity: 1,
    canRotate: true,
    edges: allFalse,
    enabled: true,
    ...p,
  }
}

function placed(p: Partial<PlacedPiece> & { pieceId: string }): PlacedPiece {
  return {
    boardId: 'b1',
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    rotated: false,
    label: p.pieceId,
    edges: allFalse,
    ...p,
  }
}

describe('utilidades de canteado', () => {
  it('normaliza cantos incompletos', () => {
    expect(normalizeEdges(undefined)).toEqual(allFalse)
    expect(normalizeEdges({ top: true })).toEqual({ ...allFalse, top: true })
  })

  it('cuenta y etiqueta los lados', () => {
    const edges = { top: true, right: false, bottom: true, left: true }
    expect(countEdges(edges)).toBe(3)
    expect(edgesLabel(edges)).toBe('Sup · Inf · Izq')
    expect(edgesLabel(allFalse)).toBe('—')
    expect(edgesSignature(edges)).toBe('top-bottom-left')
  })

  it('cuatro giros de 90° devuelven la orientación original', () => {
    const edges = { top: true, right: false, bottom: false, left: true }
    const rotated = rotateEdges(rotateEdges(rotateEdges(rotateEdges(edges))))
    expect(rotated).toEqual(edges)
  })

  it('calcula la longitud de canto según los lados marcados', () => {
    // 600 de ancho (sup/inf) + 400 de alto (izq/der)
    expect(pieceEdgeLength(piece({ id: 'p1' }))).toBe(0)
    expect(pieceEdgeLength(piece({ id: 'p2', edges: { ...allFalse, top: true, bottom: true } }))).toBe(1200)
    expect(pieceEdgeLength(piece({ id: 'p3', edges: { ...allFalse, left: true, right: true } }))).toBe(800)
    expect(
      pieceEdgeLength(piece({ id: 'p4', edges: { top: true, right: true, bottom: true, left: true } })),
    ).toBe(2000)
  })

  it('usa las dimensiones colocadas para el canto', () => {
    // Pieza girada: 400 de ancho, 600 de alto
    expect(placedEdgeLength(placed({ pieceId: 'p1', width: 400, height: 600, rotated: true, edges: { ...allFalse, top: true } }))).toBe(400)
    expect(placedEdgeLength(placed({ pieceId: 'p1', width: 400, height: 600, rotated: true, edges: { ...allFalse, left: true } }))).toBe(600)
  })

  it('agrupa el canto por pieza del catálogo', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', label: 'Puerta', quantity: 3, edges: { ...allFalse, top: true, bottom: true } }),
      piece({ id: 'p2', label: 'Estante', quantity: 2 }),
    ]
    const placedPieces: PlacedPiece[] = [
      placed({ pieceId: 'p1', label: 'Puerta', edges: { ...allFalse, top: true, bottom: true } }),
      placed({ pieceId: 'p1', label: 'Puerta', width: 400, height: 600, rotated: true, edges: { ...allFalse, right: true, left: true } }),
      placed({ pieceId: 'p2', label: 'Estante' }),
    ]

    const rows = summarizeEdgeBanding(pieces, placedPieces)
    expect(rows).toHaveLength(1)
    expect(rows[0].label).toBe('Puerta')
    expect(rows[0].placedCount).toBe(2)
    expect(rows[0].length).toBe(2400) // 1200 + 1200
    expect(rows[0].edges).toEqual({ ...allFalse, top: true, bottom: true })
  })

  it('reporta cuántas piezas faltan por colocar', () => {
    const pieces: Piece[] = [
      piece({ id: 'p1', label: 'Puerta', quantity: 3 }),
      piece({ id: 'p2', label: 'Estante', quantity: 2 }),
    ]
    const rows = unplacedSummary(pieces, [placed({ pieceId: 'p1' })])
    expect(rows.map(r => ({ label: r.piece.label, missing: r.missing }))).toEqual([
      { label: 'Puerta', missing: 2 },
      { label: 'Estante', missing: 2 },
    ])
  })
})
