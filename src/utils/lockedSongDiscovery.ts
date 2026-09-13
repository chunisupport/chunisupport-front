import type { PlayerRecordDTO, SongDTO } from '../types/api'
import type { FilterState } from '../types/recordFilter'
import type { OverPowerChartEntry, OverPowerSummaryRow } from '../usecases/overpower/types'

/** OP内部計算で使う小数第3位までの整数倍率。 */
export const OVER_POWER_SCALE = 1_000

/** 筐体のOP表示単位。 */
export const OBSERVED_OVER_POWER_UNIT_MILLI = 10

/** 筐体のOP%表示単位。 */
export const OBSERVED_PERCENT_UNIT_BASIS_POINTS = 1

/** 収録バージョンを解決できない候補の表示名。 */
const UNKNOWN_VERSION_LABEL = '不明'

/** ジャンル別・バージョン別の筐体観測値。 */
export type LockedSongObservation = {
  overPower: string
  percent: string
}

/** 未解禁曲ディスカバーで独立して照合する難易度。 */
export type LockedSongDiscoveryDifficulty = 'MASTER' | 'ULTIMA'

/** 観測値とChuniSupport計算値の照合状態。 */
export type LockedSongComparisonStatus = 'empty' | 'invalid' | 'match' | 'mismatch'

/** 観測値とChuniSupport計算値の照合結果。 */
export type LockedSongComparison = {
  status: LockedSongComparisonStatus
  overPowerError: string
  percentError: string
}

/** 不一致のジャンルとバージョンから絞り込んだ候補範囲。 */
export type LockedSongDiscoveryCell = {
  difficulty: LockedSongDiscoveryDifficulty
  genre: string
  version: string
  songs: Array<Pick<SongDTO, 'id' | 'title'>>
}

/** OP / OP%入力値の解析結果。 */
export type LockedSongObservationParseResult =
  | { ok: true; scaledValue: number }
  | { ok: false; error: string }

/** 小数第2位までを許可する非負数の入力形式。 */
const DECIMAL_INPUT_PATTERN = /^\d+(?:\.\d{1,2})?$/

/**
 * 小数第2位までの表示値を、浮動小数点演算を使わず整数へ変換する。
 *
 * @param value - 筐体に表示された数値の入力文字列。
 * @param label - エラー文に表示する項目名。
 * @param max - 入力可能な上限。未指定なら上限なし。
 * @returns 100倍した整数、または入力エラー。
 */
export const parseDisplayedHundredths = (
  value: string,
  label: string,
  max?: number
): LockedSongObservationParseResult => {
  const normalized = value.trim()
  if (!DECIMAL_INPUT_PATTERN.test(normalized)) {
    return { ok: false, error: `${label}は0以上、小数第2位までで入力してください。` }
  }

  const [integerPart, decimalPart = ''] = normalized.split('.')
  const scaledValue = Number(integerPart) * 100 + Number(decimalPart.padEnd(2, '0'))
  if (!Number.isSafeInteger(scaledValue) || (max !== undefined && scaledValue > max * 100)) {
    return { ok: false, error: `${label}は${max ?? '有効な範囲'}以下で入力してください。` }
  }

  return { ok: true, scaledValue }
}

/**
 * 内部OPと理論OPが、入力された筐体表示区間を同時に満たすか判定する。
 *
 * @param actualMilli - 内部OP値。
 * @param theoreticalMilli - 理論OP値。
 * @param observedOverPowerMilli - 筐体表示OPの区間下端。
 * @param observedPercentBasisPoints - 筐体表示OP%を100倍した区間下端。
 * @returns OPとOP%の両方が筐体表示と一致する場合はtrue。
 */
export const matchesLockedSongObservation = (
  actualMilli: number,
  theoreticalMilli: number,
  observedOverPowerMilli: number,
  observedPercentBasisPoints: number
): boolean => {
  return (
    matchesObservedOverPower(actualMilli, observedOverPowerMilli) &&
    matchesObservedPercent(actualMilli, theoreticalMilli, observedPercentBasisPoints)
  )
}

/**
 * 内部OPが入力された筐体OPの表示区間を満たすか判定する。
 *
 * @param actualMilli - 内部OP値。
 * @param observedOverPowerMilli - 筐体表示OPの区間下端。
 * @returns 筐体OP表示と一致する場合はtrue。
 */
const matchesObservedOverPower = (actualMilli: number, observedOverPowerMilli: number): boolean =>
  observedOverPowerMilli <= actualMilli &&
  actualMilli < observedOverPowerMilli + OBSERVED_OVER_POWER_UNIT_MILLI

/**
 * 内部OPと理論OPの比率が入力された筐体OP%の表示区間を満たすか判定する。
 *
 * @param actualMilli - 内部OP値。
 * @param theoreticalMilli - 理論OP値。
 * @param observedPercentBasisPoints - 筐体表示OP%を100倍した区間下端。
 * @returns 筐体OP%表示と一致する場合はtrue。
 */
const matchesObservedPercent = (
  actualMilli: number,
  theoreticalMilli: number,
  observedPercentBasisPoints: number
): boolean => {
  if (theoreticalMilli <= 0) return false

  const scaledActual = 10_000 * actualMilli
  return (
    observedPercentBasisPoints * theoreticalMilli <= scaledActual &&
    scaledActual <
      (observedPercentBasisPoints + OBSERVED_PERCENT_UNIT_BASIS_POINTS) * theoreticalMilli
  )
}

/**
 * 1分類の筐体観測値をChuniSupportの集計行と照合する。
 *
 * @param row - 未解禁設定を適用していないChuniSupport集計値。
 * @param observation - 筐体に表示されたOPとOP%。
 * @returns 入力状態、照合結果、項目別エラー。
 */
export const compareLockedSongObservation = (
  row: OverPowerSummaryRow,
  observation: LockedSongObservation
): LockedSongComparison => {
  const overPower = observation.overPower.trim()
  const percent = observation.percent.trim()
  if (!overPower && !percent) {
    return { status: 'empty', overPowerError: '', percentError: '' }
  }
  const parsedOverPower = overPower ? parseDisplayedHundredths(overPower, 'OP') : undefined
  const parsedPercent = percent ? parseDisplayedHundredths(percent, 'OP%', 100) : undefined
  if (parsedOverPower?.ok === false || parsedPercent?.ok === false) {
    return {
      status: 'invalid',
      overPowerError: parsedOverPower?.ok === false ? parsedOverPower.error : '',
      percentError: parsedPercent?.ok === false ? parsedPercent.error : '',
    }
  }

  const actualMilli = Math.round(row.current * OVER_POWER_SCALE)
  const theoreticalMilli = Math.round(row.max * OVER_POWER_SCALE)
  const matchesOverPower =
    !parsedOverPower || matchesObservedOverPower(actualMilli, parsedOverPower.scaledValue * 10)
  const matchesPercent =
    !parsedPercent ||
    matchesObservedPercent(actualMilli, theoreticalMilli, parsedPercent.scaledValue)
  return {
    status: matchesOverPower && matchesPercent ? 'match' : 'mismatch',
    overPowerError: '',
    percentError: '',
  }
}

/**
 * 不一致のジャンルとバージョンでOP対象曲を候補範囲へまとめる。
 *
 * @param entries - 曲ごとのOP対象譜面エントリ。
 * @param mismatchedGenres - 筐体表示と一致しなかったジャンル。
 * @param mismatchedVersions - 筐体表示と一致しなかったバージョン。
 * @param difficulty - 候補として抽出する難易度。
 * @returns 入力済みの差異だけで絞り込んだジャンル・バージョン一覧。
 */
export const buildLockedSongDiscoveryCells = (
  entries: OverPowerChartEntry[],
  mismatchedGenres: readonly string[],
  mismatchedVersions: readonly string[],
  difficulty: LockedSongDiscoveryDifficulty
): LockedSongDiscoveryCell[] => {
  const genreSet = new Set(mismatchedGenres)
  const versionSet = new Set(mismatchedVersions)
  const cells = new Map<string, LockedSongDiscoveryCell>()
  if (genreSet.size === 0 && versionSet.size === 0) return []

  for (const entry of entries) {
    if (entry.difficulty !== difficulty) continue
    const genre = entry.song.genre
    if (!genre) continue
    if (genreSet.size > 0 && !genreSet.has(genre)) continue
    if (versionSet.size > 0 && (!entry.versionName || !versionSet.has(entry.versionName))) continue
    const version = entry.versionName ?? UNKNOWN_VERSION_LABEL
    const key = `${genre}\u0000${version}`
    const cell = cells.get(key) ?? { difficulty, genre, version, songs: [] }
    if (!cell.songs.some((song) => song.id === entry.song.id)) {
      cell.songs.push({ id: entry.song.id, title: entry.song.title })
    }
    cells.set(key, cell)
  }

  return [...cells.values()]
}

/**
 * 候補範囲を表示する通常レコード用フィルターへ変換する。
 *
 * @param defaultFilter - マスタデータを反映した通常レコードの既定フィルター。
 * @param candidate - 遷移元の候補範囲。
 * @returns 候補の難易度、ジャンル、バージョンだけを指定した通常レコードフィルター。
 */
export const buildLockedSongCandidateRecordFilter = (
  defaultFilter: FilterState,
  candidate: Pick<LockedSongDiscoveryCell, 'difficulty' | 'genre' | 'version'>
): FilterState => ({
  ...defaultFilter,
  difficulties: [candidate.difficulty],
  genres: [candidate.genre],
  versions: [candidate.version],
})

/**
 * 楽曲マスタに存在する全通常譜面のレコードが取得できているか判定する。
 *
 * @param songs - 通常楽曲マスタ。
 * @param records - 未プレイ補完済みの通常譜面レコード。
 * @returns 全譜面のレコードが揃っている場合はtrue。
 */
export const hasCompleteLockedSongDiscoveryRecords = (
  songs: SongDTO[],
  records: PlayerRecordDTO[]
): boolean => {
  const recordKeys = new Set(records.map((record) => `${record.id}:${record.difficulty}`))
  return songs.every((song) =>
    Object.entries(song.charts).every(
      ([difficulty, chart]) => !chart || recordKeys.has(`${song.id}:${difficulty.toUpperCase()}`)
    )
  )
}
