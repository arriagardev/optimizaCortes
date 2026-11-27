import { describe, it, expect } from 'vitest'
import { findFreeAreas } from './freeRects'
import type { CutResult, PieceEdges } from '../types'

const noEdges: PieceEdges = { top: false, right: false, bottom: false, left: false }

function result(overrides: Partial<CutResult> = {}): CutResult {
  return {
    boardId: 'b1',
    boardWidth: 100,
    boardHeight: 100,
    grain: 'none',
    trim: 0,
    placedPieces: [],
    usedArea: 0,
    totalArea: 100 * 100,
    efficiency: 0,
    edgeLength: 0,
    ...overrides,
  }
}

describe('findFreeAreas', () => {
  it('devuelve todo el tablero cuando no hay piezas', () => {
    const areas = findFreeAreas(result(), 0, 0)
    expect(areas).toEqual([{ x: 0, y: 0, width: 100, height: 100, area: 10000 }])
  })

  it('descuenta la pieza y el kerf', () => {
    const areas = findFreeAreas(
      result({
        placedPieces: [
          {
            pieceId: 'p1',
            boardId: 'b1',
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            rotated: false,
            label: 'A',
            step: 1,
            edges: noEdges,
          },
        ],
        usedArea: 2500,
      }),
      5,
      5,
    )
    expect(areas.some(area => area.x === 0 && area.y === 0)).toBe(false)
    expect(areas.every(area => area.width > 0 && area.height > 0)).toBe(true)
    expect(areas.reduce((sum, area) => sum + area.area, 0)).toBeGreaterThan(0)
  })

  it('respeta el refile y descarta sobrantes muy pequeños', () => {
    const areas = findFreeAreas(result({ trim: 10, totalArea: 80 * 80 }), 0, 0, 0.5)
    expect(areas).toEqual([{ x: 10, y: 10, width: 80, height: 80, area: 6400 }])

    const tiny = findFreeAreas(
      result({
        trim: 10,
        totalArea: 80 * 80,
        placedPieces: [
          {
            pieceId: 'p1',
            boardId: 'b1',
            x: 10,
            y: 10,
            width: 70,
            height: 70,
            rotated: false,
            label: 'A',
            step: 1,
            edges: noEdges,
          },
        ],
      }),
      0,
      0,
      0.5,
    )
    expect(tiny).toHaveLength(0)
  })
})
