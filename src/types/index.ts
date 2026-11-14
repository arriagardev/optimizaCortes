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
  /** Secuencia de cortes guillotina (solo disponible con el algoritmo Guillotine). */
  cutSteps?: PanelCut[]
}

/**
 * Un corte recto sobre un panel. Las medidas van en la unidad del proyecto.
 * `offset` se mide desde el borde izquierdo (vertical) o superior (horizontal)
 * del panel que se está cortando.
 */
export interface PanelCut {
  panelId: number
  panelX: number
  panelY: number
  panelWidth: number
  panelHeight: number
  orientation: 'vertical' | 'horizontal'
  offset: number
  /** Largo del corte: alto del panel si es vertical, ancho si es horizontal. */
  length: number
  /** Nivel de anidamiento: primero se cortan los paneles de menor profundidad. */
  depth: number
  /** Pieza que se obtiene al separar este panel. */
  label: string
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
  /** Costo del tablero por metro cuadrado (0 = sin costeo). */
  boardCostPerM2: number
  /** Costo del canto por metro lineal (0 = sin costeo). */
  edgeCostPerMeter: number
  currency: Currency
}

export type Currency = 'MXN' | 'USD' | 'EUR'
