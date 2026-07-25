export type UnitSystem = 'METRIC' | 'IMPERIAL';

export const KG_TO_LBS = 2.2046226218;
export const CM_TO_INCHES = 0.3937007874;

export function kgToLbs(kg: number): number {
  return Number((kg * KG_TO_LBS).toFixed(1));
}

export function lbsToKg(lbs: number): number {
  return Number((lbs / KG_TO_LBS).toFixed(2));
}

export function cmToInches(cm: number): number {
  return Number((cm * CM_TO_INCHES).toFixed(1));
}

export function inchesToCm(inches: number): number {
  return Number((inches / CM_TO_INCHES).toFixed(1));
}

export function formatWeightValue(kg: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'IMPERIAL') {
    return kgToLbs(kg);
  }
  return Number(kg.toFixed(1));
}

export function getWeightUnitLabel(unitSystem: UnitSystem): string {
  return unitSystem === 'IMPERIAL' ? 'lbs' : 'kg';
}

export function parseWeightToKg(value: number, unitSystem: UnitSystem): number {
  if (unitSystem === 'IMPERIAL') {
    return lbsToKg(value);
  }
  return value;
}

export function formatHeightValue(cm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'IMPERIAL') {
    const totalInches = Math.round(cmToInches(cm));
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}
