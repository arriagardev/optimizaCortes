import type { Board, Piece, AppSettings } from '../types'

interface ProjectFile {
  version: number
  boards: Board[]
  pieces: Piece[]
  settings: AppSettings
}

export function exportProject(boards: Board[], pieces: Piece[], settings: AppSettings): void {
  const data: ProjectFile = { version: 1, boards, pieces, settings }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `optimizaCortes-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importProject(
  file: File,
  onLoad: (boards: Board[], pieces: Piece[], settings: AppSettings) => void,
  onError: (msg: string) => void,
): void {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const raw = e.target?.result
      if (typeof raw !== 'string') throw new Error()
      const data = JSON.parse(raw) as ProjectFile
      if (!Array.isArray(data.boards) || !Array.isArray(data.pieces) || !data.settings) {
        throw new Error()
      }
      onLoad(data.boards, data.pieces, data.settings)
    } catch {
      onError('El archivo no es un proyecto válido de OptimizaCortes.')
    }
  }
  reader.readAsText(file)
}
