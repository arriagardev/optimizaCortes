import type { Piece } from '../types'

export function exportPiecesCsv(pieces: Piece[]): void {
  const headers = ['Etiqueta', 'Ancho', 'Alto', 'Cantidad', 'Rotar', 'Veta', 'CantoSup', 'CantoDer', 'CantoInf', 'CantoIzq']
  const rows = pieces.map(p => [
    `"${p.label.replace(/"/g, '""')}"`,
    p.width,
    p.height,
    p.quantity,
    p.canRotate ? 'si' : 'no',
    p.grain ? 'si' : 'no',
    p.edges.top ? 'si' : 'no',
    p.edges.right ? 'si' : 'no',
    p.edges.bottom ? 'si' : 'no',
    p.edges.left ? 'si' : 'no',
  ])
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `piezas-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function importPiecesCsv(
  file: File,
  onAddPieces: (pieces: Omit<Piece, 'id'>[]) => void,
  onError: (msg: string) => void,
): void {
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const raw = e.target?.result
      if (typeof raw !== 'string') throw new Error()
      const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
      if (lines.length < 2) throw new Error()

      const newPieces: Omit<Piece, 'id'>[] = []
      for (let i = 1; i < lines.length; i++) {
        const parts = parseCsvLine(lines[i])
        if (parts.length < 4) continue
        const label = parts[0].replace(/^["']|["']$/g, '') || 'Pieza'
        const width = Number(parts[1])
        const height = Number(parts[2])
        const quantity = Number(parts[3])
        if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
          continue
        }
        const canRotate = parts[4] ? ['si', 'sí', 'true', '1', 'yes'].includes(parts[4].toLowerCase()) : true
        const grain = parts[5] ? ['si', 'sí', 'true', '1', 'yes'].includes(parts[5].toLowerCase()) : false
        const top = parts[6] ? ['si', 'sí', 'true', '1', 'yes'].includes(parts[6].toLowerCase()) : false
        const right = parts[7] ? ['si', 'sí', 'true', '1', 'yes'].includes(parts[7].toLowerCase()) : false
        const bottom = parts[8] ? ['si', 'sí', 'true', '1', 'yes'].includes(parts[8].toLowerCase()) : false
        const left = parts[9] ? ['si', 'sí', 'true', '1', 'yes'].includes(parts[9].toLowerCase()) : false

        newPieces.push({
          label,
          width,
          height,
          quantity,
          canRotate,
          grain,
          edges: { top, right, bottom, left },
          enabled: true,
        })
      }

      if (newPieces.length === 0) {
        throw new Error()
      }
      onAddPieces(newPieces)
    } catch {
      onError('El archivo CSV no tiene un formato válido (Etiqueta, Ancho, Alto, Cantidad, ...).')
    }
  }
  reader.readAsText(file)
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let inQuotes = false
  let current = ''
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}
