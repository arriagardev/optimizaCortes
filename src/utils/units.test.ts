import { describe, it, expect } from 'vitest'
import {
  areaToM2,
  convertValue,
  formatMeasure,
  formatMoney,
  lengthToMeters,
  mmToUnit,
} from './units'

describe('unidades', () => {
  it('convierte longitudes entre unidades', () => {
    expect(convertValue(2440, 'mm', 'cm')).toBe(244)
    expect(convertValue(244, 'cm', 'mm')).toBe(2440)
    expect(convertValue(2440, 'mm', 'in')).toBeCloseTo(96.06, 2)
    expect(mmToUnit(25.4, 'in')).toBe(1)
  })

  it('lleva longitudes a metros lineales', () => {
    expect(lengthToMeters(1000, 'mm')).toBeCloseTo(1)
    expect(lengthToMeters(100, 'cm')).toBeCloseTo(1)
    expect(lengthToMeters(1, 'in')).toBeCloseTo(0.0254)
  })

  it('lleva áreas a metros cuadrados', () => {
    expect(areaToM2(1_000_000, 'mm')).toBeCloseTo(1)
    expect(areaToM2(10_000, 'cm')).toBeCloseTo(1)
    expect(areaToM2(1550.0031, 'in')).toBeCloseTo(1, 3)
  })

  it('formatea medidas y dinero', () => {
    expect(formatMeasure(600, 'mm')).toBe('600 mm')
    expect(formatMoney(1234.5, 'MXN')).toContain('1,234.50')
  })
})
