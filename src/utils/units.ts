import type { AppSettings, Currency } from '../types'

export type Unit = AppSettings['unit']

/** Milímetros que hay en una unidad. */
export const MM_PER_UNIT: Record<Unit, number> = { mm: 1, cm: 10, in: 25.4 }

export const UNIT_LABEL: Record<Unit, string> = { mm: 'mm', cm: 'cm', in: 'in' }

export const CURRENCIES: Currency[] = ['MXN', 'USD', 'EUR']

export function unitLabel(unit: Unit): string {
  return UNIT_LABEL[unit]
}

/** Milímetros a la unidad indicada. */
export function mmToUnit(value: number, unit: Unit, decimals = 2): number {
  return convertValue(value, 'mm', unit, decimals)
}

/** Convierte un valor de una unidad a otra, redondeando para evitar arrastre de decimales. */
export function convertValue(value: number, from: Unit, to: Unit, decimals = 2): number {
  if (from === to || !Number.isFinite(value)) return value
  const mm = value * MM_PER_UNIT[from]
  const converted = mm / MM_PER_UNIT[to]
  return Number(converted.toFixed(decimals))
}

/** Área expresada en la unidad (unidad²) a metros cuadrados. */
export function areaToM2(area: number, unit: Unit): number {
  const factor = MM_PER_UNIT[unit] / 1000
  return area * factor * factor
}

/** Longitud expresada en la unidad a metros lineales. */
export function lengthToMeters(length: number, unit: Unit): number {
  return (length * MM_PER_UNIT[unit]) / 1000
}

export function formatNumber(value: number, maxDecimals = 2): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: maxDecimals }).format(value)
}

/** Ej. "600 mm" */
export function formatMeasure(value: number, unit: Unit, maxDecimals = 2): string {
  return `${formatNumber(value, maxDecimals)} ${unitLabel(unit)}`
}

/** Ej. "1.20 m" */
export function formatMeters(meters: number, maxDecimals = 2): string {
  return `${formatNumber(meters, maxDecimals)} m`
}

/** Ej. "2.98 m²" */
export function formatArea(m2: number, maxDecimals = 2): string {
  return `${formatNumber(m2, maxDecimals)} m²`
}

export function formatMoney(amount: number, currency: Currency, maxDecimals = 2): string {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      maximumFractionDigits: maxDecimals,
    }).format(amount)
  } catch {
    return `$${formatNumber(amount, maxDecimals)}`
  }
}
