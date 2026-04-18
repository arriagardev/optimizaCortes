import { useRef, useState } from 'react'
import type { Board, Piece, AppSettings } from '../../types'
import { exportProject, importProject } from '../../utils/projectIO'

interface Props {
  settings: AppSettings
  onChange: (s: AppSettings) => void
  boards: Board[]
  pieces: Piece[]
  onLoadProject: (boards: Board[], pieces: Piece[], settings: AppSettings) => void
}

export function SettingsPanel({ settings, onChange, boards, pieces, onLoadProject }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    importProject(
      file,
      (b, p, s) => onLoadProject(b, p, s),
      msg => setImportError(msg),
    )
    e.target.value = ''
  }

  return (
    <div className="form">
      <div className="form-row">
        <label>Espesor de sierra (mm)</label>
        <input
          type="number"
          value={settings.bladeThickness}
          min="0"
          step="0.5"
          onChange={e => onChange({ ...settings, bladeThickness: Number(e.target.value) })}
        />
      </div>
      <div className="form-row">
        <label>Unidad</label>
        <select
          value={settings.unit}
          onChange={e => onChange({ ...settings, unit: e.target.value as AppSettings['unit'] })}
        >
          <option value="mm">mm</option>
          <option value="cm">cm</option>
          <option value="in">pulgadas</option>
        </select>
      </div>

      <div className="project-actions">
        <span className="section-label">Proyecto</span>
        <div className="project-buttons">
          <button
            className="btn-secondary"
            onClick={() => exportProject(boards, pieces, settings)}
          >
            Exportar JSON
          </button>
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            Importar JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
        {importError && <p className="import-error">{importError}</p>}
      </div>
    </div>
  )
}
