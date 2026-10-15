import { PLAYER_DATA_DIFFICULTIES } from '../constants/difficulty'
import type { PlayerRecordDTO, SongDTO } from '../types/api'
import type { FilterState } from '../types/recordFilter'
import { selectOverPowerChartEntries } from '../usecases/overpower/aggregation'
import { OVER_POWER_THEORETICAL_TARGET } from '../usecases/overpower/constants'
import type { OverPowerChartEntry, OverPowerSummaryRow } from '../usecases/overpower/types'
import type { ChartLevelLabel } from './chartLevel'

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

/** 観測値とChuniSupport計算値の照合状態。 */
export type LockedSongComparisonStatus = 'empty' | 'invalid' | 'match' | 'mismatch'

/** 観測値とChuniSupport計算値の照合結果。 */
export type LockedSongComparison = {
  status: LockedSongComparisonStatus
  overPowerError: string
  percentError: string
}

/** 不一致のジャンル、バージョン、楽曲名順、レベルから絞り込んだ候補範囲。 */
export type LockedSongDiscoveryCell = {
  genre: string
  version: string
  /** 楽曲名順フォルダのコード。楽曲名順に差異がなければnull。 */
  nameFolder: string | null
  /** 譜面のレベル。レベルに差異がなければnull。 */
  level: ChartLevelLabel | null
  songs: Array<Pick<SongDTO, 'id' | 'title'>>
}

/** 筐体表示と一致しなかった分類。 */
export type LockedSongDiscoveryMismatches = {
  genres: readonly string[]
  versions: readonly string[]
  /** 楽曲名順フォルダのコード。 */
  nameFolders: readonly string[]
  /** 譜面のレベル表記。 */
  levels: readonly ChartLevelLabel[]
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
 * 不一致のジャンル、バージョン、楽曲名順、レベルで候補範囲をまとめる。
 *
 * @param entries - 未プレイを含む全通常譜面エントリ。
 * @param mismatches - 筐体表示と一致しなかったジャンル、バージョン、楽曲名順フォルダ、レベル。
 * @returns 入力済みの差異だけで絞り込んだジャンル・バージョン（・楽曲名順・レベル）一覧。
 * 楽曲名順とレベルは、差異がある場合だけ候補範囲を分ける軸に加える。
 */
export const buildLockedSongDiscoveryCells = (
  entries: OverPowerChartEntry[],
  mismatches: LockedSongDiscoveryMismatches
): LockedSongDiscoveryCell[] => {
  const genreSet = new Set(mismatches.genres)
  const versionSet = new Set(mismatches.versions)
  const nameFolderSet = new Set(mismatches.nameFolders)
  const levelSet = new Set(mismatches.levels)
  const cells = new Map<string, LockedSongDiscoveryCell>()
  if (
    genreSet.size === 0 &&
    versionSet.size === 0 &&
    nameFolderSet.size === 0 &&
    levelSet.size === 0
  ) {
    return []
  }

  const candidateEntries = selectOverPowerChartEntries(
    entries,
    levelSet.size > 0 ? 'ALL' : OVER_POWER_THEORETICAL_TARGET
  )
  for (const entry of candidateEntries) {
    const genre = entry.song.genre
    if (!genre) continue
    if (genreSet.size > 0 && !genreSet.has(genre)) continue
    if (versionSet.size > 0 && (!entry.versionName || !versionSet.has(entry.versionName))) continue
    if (nameFolderSet.size > 0 && !nameFolderSet.has(entry.song.name_folder_code)) continue
    if (levelSet.size > 0 && !levelSet.has(entry.level)) continue
    const version = entry.versionName ?? UNKNOWN_VERSION_LABEL
    const nameFolder = nameFolderSet.size > 0 ? entry.song.name_folder_code : null
    const level = levelSet.size > 0 ? entry.level : null
    const key = [genre, version, nameFolder ?? '', level ?? ''].join('\u0000')
    const cell = cells.get(key) ?? { genre, version, nameFolder, level, songs: [] }
    if (!cell.songs.some((song) => song.id === entry.song.id)) {
      cell.songs.push({ id: entry.song.id, title: entry.song.title })
    }
    cells.set(key, cell)
  }

  return [...cells.values()]
}

/**
 * すべての候補範囲を1回で表示する通常レコード用フィルターへ変換する。
 * 候補範囲は分類軸ごとの差異の積なので、各軸の差異を複数選択として指定すれば候補範囲の和集合と一致する。
 *
 * @param defaultFilter - マスタデータを反映した通常レコードの既定フィルター。
 * @param mismatches - 筐体表示と一致しなかったジャンル、バージョン、楽曲名順フォルダ、レベル。
 * @returns レベルに差異があれば全譜面、それ以外は理論値OP対象譜面を分類軸で絞り込んだフィルター。
 * 未解禁曲は未プレイで現在のOP対象フラグを持たないため、理論値OP対象で判定する。
 * レベルは離れた複数レベルを指定できるよう、画面に表示しないレベル指定で渡す。
 */
export const buildLockedSongCandidateRecordFilter = (
  defaultFilter: FilterState,
  mismatches: LockedSongDiscoveryMismatches
): FilterState => ({
  ...defaultFilter,
  opTargetOnly: mismatches.levels.length === 0,
  opTargetType: 'theoretical',
  difficulties: [...PLAYER_DATA_DIFFICULTIES],
  genres: mismatches.genres.length > 0 ? [...mismatches.genres] : defaultFilter.genres,
  versions: mismatches.versions.length > 0 ? [...mismatches.versions] : defaultFilter.versions,
  nameFolders: mismatches.nameFolders.length > 0 ? [...mismatches.nameFolders] : null,
  ...(mismatches.levels.length > 0 && { levelSet: [...mismatches.levels] }),
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

/** 通常楽曲とULTIMAを分けた候補行、およびその行のプレイ済みOP対象譜面。 */
export type LockedSongDiscoveryCandidate = {
  isUltima: boolean
  song: SongDTO
  opTarget: OverPowerChartEntry | null
}

/**
 * 候補楽曲を通常楽曲とULTIMAの行に分け、各行のOP対象を求める。
 *
 * @param entries - 候補レベルで絞り込む前の全譜面エントリ。
 * @param cells - 表示する候補範囲。
 * @returns 楽曲名順で通常楽曲、ULTIMAの順に並ぶ候補行。未プレイのレコードは含めない。
 */
export const buildLockedSongDiscoveryCandidates = (
  entries: OverPowerChartEntry[],
  cells: readonly LockedSongDiscoveryCell[]
): LockedSongDiscoveryCandidate[] => {
  const songIds = new Set(cells.flatMap((cell) => cell.songs.map((song) => song.id)))
  const candidateEntries = entries.filter((entry) => songIds.has(entry.song.id))
  const normalTargets = new Map(
    selectOverPowerChartEntries(
      candidateEntries.filter((entry) => entry.difficulty !== 'ULTIMA'),
      'OP_TARGET'
    ).map((entry) => [entry.song.id, entry])
  )
  const ultimaEntries = new Map(
    candidateEntries
      .filter((entry) => entry.difficulty === 'ULTIMA')
      .map((entry) => [entry.song.id, entry])
  )
  const songs = new Map(candidateEntries.map((entry) => [entry.song.id, entry.song]))
  return [...songs.values()]
    .sort((left, right) => left.title.localeCompare(right.title, 'ja'))
    .flatMap((song) => {
      const normal = normalTargets.get(song.id)
      const ultima = ultimaEntries.get(song.id)
      return [
        { song, isUltima: false, opTarget: normal?.record?.is_played ? normal : null },
        ...(ultima
          ? [{ song, isUltima: true, opTarget: ultima.record?.is_played ? ultima : null }]
          : []),
      ]
    })
}
