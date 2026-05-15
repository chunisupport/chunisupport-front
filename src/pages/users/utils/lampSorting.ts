export type HardLampKey =
  | 'FAILED'
  | 'CLEAR'
  | 'HARD'
  | 'BRAVE'
  | 'ABSOLUTE'
  | 'CATASTROPHY'
  | 'NONE'
  | 'UNPLAYED'

export const HARD_LAMP_ORDER: Record<HardLampKey, number> = {
  FAILED: -1,
  CLEAR: 0,
  HARD: 1,
  BRAVE: 2,
  ABSOLUTE: 3,
  CATASTROPHY: 4,
  NONE: 5,
  UNPLAYED: 6,
}

export const NO_HARD_CLEAR_LAMPS = new Set<HardLampKey>(['NONE', 'UNPLAYED'])

export type ComboLampKey = 'NONE' | 'FULL COMBO' | 'ALL JUSTICE' | 'UNPLAYED'

export const COMBO_LAMP_ORDER: Record<ComboLampKey, number> = {
  NONE: 0,
  'FULL COMBO': 1,
  'ALL JUSTICE': 2,
  UNPLAYED: 3,
}

export const getComboLampKey = (
  isPlayed: boolean,
  comboLamp: string | null | undefined
): ComboLampKey => {
  if (!isPlayed) {
    return 'UNPLAYED'
  }

  if (comboLamp === null || comboLamp === undefined) {
    return 'NONE'
  }

  return (comboLamp as ComboLampKey) ?? 'NONE'
}

export const compareComboLamp = (
  left: { is_played: boolean; combo_lamp: string | null | undefined },
  right: { is_played: boolean; combo_lamp: string | null | undefined }
): { comparison: number; skipDirection: boolean } => {
  const leftMissing = !left.is_played
  const rightMissing = !right.is_played

  if (leftMissing && rightMissing) return { comparison: 0, skipDirection: false }
  if (leftMissing) return { comparison: 1, skipDirection: true }
  if (rightMissing) return { comparison: -1, skipDirection: true }

  const leftKey = getComboLampKey(left.is_played, left.combo_lamp)
  const rightKey = getComboLampKey(right.is_played, right.combo_lamp)

  return {
    comparison:
      (COMBO_LAMP_ORDER[leftKey] ?? Number.MAX_SAFE_INTEGER) -
      (COMBO_LAMP_ORDER[rightKey] ?? Number.MAX_SAFE_INTEGER),
    skipDirection: false,
  }
}
export const getHardLampKey = (
  isPlayed: boolean,
  clearLamp: string | null | undefined
): HardLampKey => {
  if (!isPlayed) {
    return 'UNPLAYED'
  }

  if (clearLamp === null || clearLamp === undefined) {
    return 'NONE'
  }

  return (clearLamp as HardLampKey) ?? 'NONE'
}

export const compareHardLamp = (
  left: { is_played: boolean; clear_lamp: string | null | undefined },
  right: { is_played: boolean; clear_lamp: string | null | undefined }
): { comparison: number; skipDirection: boolean } => {
  const leftKey = getHardLampKey(left.is_played, left.clear_lamp)
  const rightKey = getHardLampKey(right.is_played, right.clear_lamp)

  const leftMissing = NO_HARD_CLEAR_LAMPS.has(leftKey)
  const rightMissing = NO_HARD_CLEAR_LAMPS.has(rightKey)

  if (leftMissing && rightMissing) return { comparison: 0, skipDirection: false }
  if (leftMissing) return { comparison: 1, skipDirection: true }
  if (rightMissing) return { comparison: -1, skipDirection: true }

  return {
    comparison:
      (HARD_LAMP_ORDER[leftKey] ?? Number.MAX_SAFE_INTEGER) -
      (HARD_LAMP_ORDER[rightKey] ?? Number.MAX_SAFE_INTEGER),
    skipDirection: false,
  }
}
