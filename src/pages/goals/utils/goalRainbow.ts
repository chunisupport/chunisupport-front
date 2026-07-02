import type {
  GoalAttributes,
  GoalDTO,
  MasterDataDTO,
  PlayerDataDifficulty,
  PlayerRecordDTO,
  SongDTO,
  VersionDTO,
} from '../../../types/api'
import { normalizeGoalAttributeIds } from './goalAttributes'
import { resolveGoalDynamicTarget } from './goalCountTarget'
import type { GoalProgressResult } from './goalProgress'
import { resolveGoalVersionValueByReleaseDate } from './goalVersion'

/** 虹枠判定で必須となる通常難易度。 */
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
 * 虹枠目標のジャンル・バージョン条件に一致する楽曲を抽出する。
 *
 * @param songs - 通常楽曲一覧。
 * @param attributes - 虹枠目標の対象条件。
 * @param masterData - ジャンルIDの解決に使うマスタデータ。
 * @param versions - バージョン条件の解決に使うバージョン一覧。
 * @returns 必須譜面が揃い、対象条件に一致する楽曲一覧。
 */
export const filterRainbowTargetSongs = (
  songs: SongDTO[],
  attributes: GoalAttributes,
  masterData: MasterDataDTO,
  versions: VersionDTO[]
): SongDTO[] => {
  const genreIds = normalizeGoalAttributeIds(attributes.genre)
  const versionIds = normalizeGoalAttributeIds(attributes.ver)
  if (genreIds?.length === 0 || versionIds?.length === 0) return []

  const genreNames = genreIds
    ? new Set(
        masterData.genres.filter((genre) => genreIds.includes(genre.id)).map((genre) => genre.name)
      )
    : undefined

  return songs.filter((song) => {
    if (!hasRainbowRequiredCharts(song)) return false
    if (genreNames && !genreNames.has(song.genre)) return false
    if (versionIds) {
      const version = resolveGoalVersionValueByReleaseDate(song.release, versions)
      if (!version || !versionIds.includes(version)) return false
    }
    return true
  })
}

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

/**
 * 虹枠目標の現在値、目標値、達成率を計算する。
 *
 * @param goal - 計算対象の虹枠目標。
 * @param targetSongs - ジャンル・バージョン条件に一致する対象楽曲。
 * @param records - プレイヤーの通常譜面レコード。
 * @returns 目標カード表示に必要な進捗情報。
 */
export const calculateRainbowGoalProgress = (
  goal: GoalDTO,
  targetSongs: SongDTO[],
  records: PlayerRecordDTO[]
): GoalProgressResult => {
  const recordBySongAndDifficulty = new Map(
    records.map((record) => [`${record.id}:${record.difficulty}`, record])
  )
  const current = targetSongs.filter((song) =>
    getRainbowRequiredDifficulties(song).every(
      (difficulty) =>
        recordBySongAndDifficulty.get(`${song.id}:${difficulty}`)?.combo_lamp === 'ALL JUSTICE'
    )
  ).length
  const target = resolveGoalDynamicTarget(goal.achievement_params, targetSongs.length, 'count', {
    rounding: 'ceil',
  })
  const safeTarget = target <= 0 ? 1 : target
  const percent = Math.max(0, Math.min((current / safeTarget) * 100, 100))

  return {
    current,
    target,
    percent: Number.isFinite(percent) ? percent : 0,
    achieved: current >= target,
    hasUnknownMaxOp: false,
  }
}
