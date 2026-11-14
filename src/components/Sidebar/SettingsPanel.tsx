import type { AppSettings, Currency } from '../../types'
import { CURRENCIES } from '../../utils/units'

interface Props {
  settings: AppSettings
  onChange: (s: AppSettings) => void
  onChangeUnit: (u: AppSettings['unit']) => void
}

export function SettingsPanel({ settings, onChange, onChangeUnit }: Props) {
  return (
    <div className="form">
      <div className="form-row">
        <label>Espesor de sierra</label>
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
          onChange={e => onChangeUnit(e.target.value as AppSettings['unit'])}
        >
          <option value="mm">mm</option>
          <option value="cm">cm</option>
          <option value="in">pulgadas</option>
        </select>
      </div>
      <p className="form-hint">Al cambiar la unidad se convierten las medidas capturadas.</p>

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
      <p className="form-hint">La secuencia de cortes para el taller se genera con Guillotine.</p>

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

      <h4 className="form-section">Reporte PDF</h4>
      <div className="form-row">
        <label>Secuencia de cortes</label>
        <select
          value={settings.pdfSequenceOrder}
          onChange={e => onChange({ ...settings, pdfSequenceOrder: e.target.value as AppSettings['pdfSequenceOrder'] })}
        >
          <option value="end">Al final del reporte</option>
          <option value="board">Junto a cada tablero</option>
        </select>
      </div>
      <p className="form-hint">
        {settings.pdfSequenceOrder === 'end'
          ? 'El resumen y los tableros van primero; las secuencias de cortes se agrupan al final.'
          : 'Cada tablero incluye su layout, piezas y secuencia de cortes en la misma página.'}
      </p>

      <h4 className="form-section">Costos</h4>
      <div className="form-row">
        <label>Tablero por m²</label>
        <input
          type="number"
          value={settings.boardCostPerM2}
          min="0"
          step="0.01"
          onChange={e => onChange({ ...settings, boardCostPerM2: Number(e.target.value) })}
        />
      </div>
      <div className="form-row">
        <label>Canto por metro</label>
        <input
          type="number"
          value={settings.edgeCostPerMeter}
          min="0"
          step="0.01"
          onChange={e => onChange({ ...settings, edgeCostPerMeter: Number(e.target.value) })}
        />
      </div>
      <div className="form-row">
        <label>Moneda</label>
        <select
          value={settings.currency}
          onChange={e => onChange({ ...settings, currency: e.target.value as Currency })}
        >
          {CURRENCIES.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>
      <p className="form-hint">Deja los costos en 0 para ocultar el costeo. El tablero se cobra completo, incluido el desperdicio.</p>
    </div>
  )
}
