export type EdgeSide = 'top' | 'right' | 'bottom' | 'left'

/** Lados de una pieza que llevan canto pegado (en la orientación propia de la pieza). */
export interface PieceEdges {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

export interface Board {
  id: string
  width: number
  height: number
  material: string
  quantity: number
}

export interface Piece {
  id: string
  width: number
  height: number
  label: string
  quantity: number
  canRotate: boolean
  edges: PieceEdges
}

export interface PlacedPiece {
  pieceId: string
  boardId: string
  x: number
  y: number
  width: number
  height: number
  rotated: boolean
  label: string
  /** Lados con canto ya rotados a la orientación en que quedó la pieza en el tablero. */
  edges: PieceEdges
}

export interface CutResult {
  boardId: string
  boardWidth: number
  boardHeight: number
  placedPieces: PlacedPiece[]
  usedArea: number
  totalArea: number
  efficiency: number
  /** Longitud total de canto de las piezas de este tablero, en la unidad de medida. */
  edgeLength: number
}

export interface CutSolution {
  results: CutResult[]
  unplacedPieces: Piece[]
  totalEfficiency: number
  totalEdgeLength: number
  algorithmUsed: 'guillotine' | 'maxrects'
}

export interface AppSettings {
  bladeThickness: number
  unit: 'mm' | 'cm' | 'in'
  algorithm: 'guillotine' | 'maxrects' | 'auto'
  /** 'area' ordena por área (mejor empaque); 'manual' respeta el orden de la lista de piezas. */
  pieceOrder: 'area' | 'manual'
}
