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
  a.download = `optimizacortes-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importProject(
  file: File,
  onSuccess: (boards: Board[], pieces: Piece[], settings: AppSettings) => void,
  onError: (msg: string) => void,
): void {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target!.result as string) as Partial<ProjectFile>
      if (!Array.isArray(data.boards) || !Array.isArray(data.pieces) || !data.settings) {
        onError('Archivo inválido: faltan campos requeridos.')
        return
      }
      onSuccess(data.boards, data.pieces, data.settings)
    } catch {
      onError('No se pudo leer el archivo. Verifica que sea un JSON válido.')
    }
  }
  reader.readAsText(file)
}
