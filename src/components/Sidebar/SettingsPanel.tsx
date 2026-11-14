import type { AppSettings } from '../../types'

interface Props {
  settings: AppSettings
  onChange: (s: AppSettings) => void
}

export function SettingsPanel({ settings, onChange }: Props) {
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
      <div className="form-row">
        <label>Algoritmo</label>
        <select
          value={settings.algorithm}
          onChange={e => onChange({ ...settings, algorithm: e.target.value as AppSettings['algorithm'] })}
        >
          <option value="auto">Auto (elige el mejor)</option>
          <option value="guillotine">Guillotine</option>
          <option value="maxrects">MaxRects</option>
        </select>
      </div>
      <div className="form-row">
        <label>Orden de piezas</label>
        <select
          value={settings.pieceOrder}
          onChange={e => onChange({ ...settings, pieceOrder: e.target.value as AppSettings['pieceOrder'] })}
        >
          <option value="area">Automático (por área)</option>
          <option value="manual">Manual (orden de la lista)</option>
        </select>
      </div>
      <p className="form-hint">
        {settings.pieceOrder === 'area'
          ? 'Las piezas grandes se colocan primero: mejor aprovechamiento del tablero.'
          : 'Se respeta el orden de la lista de piezas; arrastra o usa ↑ ↓ para priorizar.'}
      </p>
    </div>
  )
}
