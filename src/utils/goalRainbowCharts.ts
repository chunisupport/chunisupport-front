import type { PlayerDataDifficulty, SongDTO } from '../types/api'

/** 虹枠判定で必須となる通常難易度 */
export const RAINBOW_REQUIRED_DIFFICULTIES = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
] as const satisfies readonly PlayerDataDifficulty[]

/**
 * 楽曲が虹枠判定に必要なBASICからMASTERまでの譜面を持つか判定する。
 *
 * @param song - 判定対象の楽曲。
 * @returns 必須譜面がすべて存在する場合はtrue。
 */
export const hasRainbowRequiredCharts = (song: SongDTO): boolean =>
  RAINBOW_REQUIRED_DIFFICULTIES.every((difficulty) => Boolean(song.charts[difficulty]))

/**
 * 楽曲の虹枠判定でAJが必要な難易度を返す。
 *
 * @param song - 判定対象の楽曲。
 * @returns BASICからMASTER、および存在する場合はULTIMAを含む難易度一覧。
 */
export const getRainbowRequiredDifficulties = (song: SongDTO): PlayerDataDifficulty[] => [
  ...RAINBOW_REQUIRED_DIFFICULTIES,
  ...(song.charts.ULTIMA ? (['ULTIMA'] as const) : []),
]
