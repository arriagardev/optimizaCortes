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
}

export interface CutResult {
  boardId: string
  boardWidth: number
  boardHeight: number
  placedPieces: PlacedPiece[]
  usedArea: number
  totalArea: number
  efficiency: number
}

export interface CutSolution {
  results: CutResult[]
  unplacedPieces: Piece[]
  totalEfficiency: number
}

export interface AppSettings {
  bladeThickness: number
  unit: 'mm' | 'cm' | 'in'
}
