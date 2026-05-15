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
