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
    </div>
  )
}
