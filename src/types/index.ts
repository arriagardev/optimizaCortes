export type EdgeSide = 'top' | 'right' | 'bottom' | 'left'

/** Lados de una pieza que llevan canto pegado (en la orientación propia de la pieza). */
export interface PieceEdges {
  top: boolean
  right: boolean
  bottom: boolean
  left: boolean
}

/** Dirección de la veta del tablero respecto a sus dimensiones. */
export type GrainDirection = 'none' | 'width' | 'height'

export interface Board {
  id: string
  width: number
  height: number
  material: string
  quantity: number
  /** Veta del tablero: 'width' corre a lo ancho, 'height' a lo alto. */
  grain: GrainDirection
  /** Margen de refile que se descarta en cada borde, en la unidad del proyecto. */
  trim: number
  /** Si es false el tablero se conserva en el proyecto pero no se usa al optimizar. */
  enabled: boolean
}

export interface Piece {
  id: string
  width: number
  height: number
  label: string
  quantity: number
  canRotate: boolean
  edges: PieceEdges
  /** La pieza debe conservar la veta del tablero a lo largo de su ancho. */
  grain: boolean
  /** Si es false la pieza se conserva en el proyecto pero no se usa al optimizar. */
  enabled: boolean
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
  /** Número de la pieza dentro del tablero (orden de colocación), para el taller. */
  step: number
  /** Lados con canto ya rotados a la orientación en que quedó la pieza en el tablero. */
  edges: PieceEdges
}

export interface CutResult {
  boardId: string
  boardWidth: number
  boardHeight: number
  /** Veta del tablero usada al optimizar (para indicarla en el layout). */
  grain: GrainDirection
  /** Refile aplicado en cada borde al calcular el área útil. */
  trim: number
  placedPieces: PlacedPiece[]
  usedArea: number
  /** Área útil del tablero (descontando el refile). */
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
  /** Grosor del corte vertical (a lo ancho del tablero). */
  kerfX: number
  /** Grosor del corte horizontal (a lo alto del tablero). */
  kerfY: number
  /** Espesor del material de canto que se compensa en la dimensión de corte. */
  edgeThickness: number
  unit: 'mm' | 'cm' | 'in'
  algorithm: 'guillotine' | 'maxrects' | 'auto'
  /** 'area' ordena por área (mejor empaque); 'manual' respeta el orden de la lista de piezas. */
  pieceOrder: 'area' | 'manual'
  /** Costo del tablero por metro cuadrado (0 = sin costeo). */
  boardCostPerM2: number
  /** Costo del canto por metro lineal (0 = sin costeo). */
  edgeCostPerMeter: number
  currency: Currency
  /**
   * 'end' (predeterminado) agrupa todas las secuencias de cortes al final del PDF;
   * 'board' deja la secuencia de cada tablero junto a su layout.
   */
  pdfSequenceOrder: 'end' | 'board'
}

export type Currency = 'MXN' | 'USD' | 'EUR'
