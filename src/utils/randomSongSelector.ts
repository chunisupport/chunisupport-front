import type { PlayerDataDifficulty, PlayerRecordDTO, SongDTO, VersionDTO } from '../types/api'
import { formatChartConst } from './chartConstFormat'
import { getShortVersionName, resolveVersionNameByReleaseDate } from './versionConverter'

/**
 * ランダム選曲ツールで扱う通常譜面難易度。
 */
export const RANDOM_SONG_SELECTOR_DIFFICULTIES: PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

/**
 * ランダム選曲の難易度絞り込みでOP対象譜面を表す専用値。
 */
export const RANDOM_SONG_OP_TARGET_FILTER = 'OP_TARGET'

/**
 * ランダム選曲の難易度絞り込みで扱う通常難易度またはOP対象の値。
 */
export type RandomSongDifficultyFilter = PlayerDataDifficulty | typeof RANDOM_SONG_OP_TARGET_FILTER

/**
 * ランダム選曲の難易度絞り込みで表示する選択肢。
 */
export const RANDOM_SONG_SELECTOR_DIFFICULTY_FILTERS: RandomSongDifficultyFilter[] = [
  ...RANDOM_SONG_SELECTOR_DIFFICULTIES,
  RANDOM_SONG_OP_TARGET_FILTER,
]

export type RandomSongCandidate = {
  song: SongDTO
  difficulty: PlayerDataDifficulty
  chartConst: number
  levelLabel: string
  genre: string
  version: string
}

export type RandomSongFilter = {
  difficulties: readonly RandomSongDifficultyFilter[]
  genres: readonly string[]
  versions: readonly string[]
  minConst: number | null
  maxConst: number | null
}

export type RandomSongWeight = {
  difficultyWeights?: Partial<Record<PlayerDataDifficulty, number>>
  constWeights?: Partial<Record<string, number>>
}

export type RandomSongPlayStatusFilter = 'all' | 'played' | 'unplayed'

export type RandomSongBestFrameFilter = 'all' | 'only' | 'exclude'

export type RandomSongLampFilter =
  | 'AJC'
  | 'AJ'
  | 'FC'
  | 'CATASTROPHY'
  | 'ABSOLUTE'
  | 'BRAVE'
  | 'HARD'
  | 'CLEAR'
  | 'FAILED'
  | 'NONE'

export type RandomSongRecordFilter = {
  playStatus: RandomSongPlayStatusFilter
  bestFrame: RandomSongBestFrameFilter
  minScore: number | null
  maxScore: number | null
  lamps: readonly RandomSongLampFilter[]
}

/**
 * 楽曲IDと難易度から譜面単位のキーを生成する。
 *
 * @param songId - 楽曲ID。
 * @param difficulty - 難易度。
 * @returns 譜面単位キー。
 */
export const createRandomSongChartKey = (
  songId: string,
  difficulty: PlayerDataDifficulty
): string => `${songId}:${difficulty}`

/**
 * ランダム選曲候補の譜面単位キーを生成する。
 *
 * @param candidate - 選曲候補。
 * @returns 楽曲IDと難易度からなる譜面単位キー。
 */
export const createRandomSongCandidateKey = (candidate: RandomSongCandidate): string =>
  createRandomSongChartKey(candidate.song.id, candidate.difficulty)

/**
 * 入力文字列を任意の数値へ変換する。
 *
 * @param value - 入力欄の値。
 * @returns 空欄なら null、それ以外は数値。
 */
export const parseOptionalRandomSongDecimal = (value: string): number | null => {
  const trimmed = value.trim()
  if (trimmed === '') return null

  const parsed = Number(trimmed.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * 入力文字列を選曲数へ変換する。
 *
 * @param value - 曲数入力欄の値。
 * @returns 有効な選曲数。無効値の場合は null。
 */
export const parseRandomSongDrawCount = (value: string): number | null => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return null
  return parsed
}

/**
 * 倍率入力値を抽選用の数値へ変換する。
 *
 * @param value - 倍率入力欄の値。
 * @returns 有効な倍率。無効値の場合は null。
 */
export const parseRandomSongWeightValue = (value: string): number | null => {
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/**
 * 倍率入力Mapを抽選ロジック用の数値Mapへ変換する。
 *
 * @param values - 選択肢ごとの倍率入力値。
 * @returns 数値化された倍率Map。
 */
export const parseRandomSongWeightValues = <T extends string>(
  values: Partial<Record<T, string>>
): Partial<Record<T, number>> => {
  const parsedEntries = Object.entries(values).flatMap(([key, value]) => {
    if (typeof value !== 'string') return []

    const parsed = parseRandomSongWeightValue(value)
    return parsed === null ? [] : [[key, parsed]]
  })
  return Object.fromEntries(parsedEntries) as Partial<Record<T, number>>
}

/**
 * 倍率入力Mapに無効値が含まれているか判定する。
 *
 * @param values - 選択肢ごとの倍率入力値。
 * @returns 無効な倍率が含まれている場合は true。
 */
export const hasInvalidRandomSongWeightValue = <T extends string>(
  values: Partial<Record<T, string>>
): boolean =>
  Object.values(values).some((value) => parseRandomSongWeightValue(String(value)) === null)

/**
 * 配列内の値を選択状態として切り替える。
 *
 * @param values - 現在の選択値。
 * @param value - 切り替える値。
 * @returns 切り替え後の選択値。
 */
export const toggleRandomSongSelectionValue = <T>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

/**
 * 保存済みキーから選曲結果を復元する。
 *
 * @param candidates - 復元元になる現在の候補一覧。
 * @param keys - 保存済みの譜面単位キー。
 * @returns 現在の候補一覧に存在する選曲結果。
 */
export const restoreRandomSongResults = (
  candidates: readonly RandomSongCandidate[],
  keys: readonly string[]
): RandomSongCandidate[] => {
  const candidateByKey = new Map(
    candidates.map((candidate) => [createRandomSongCandidateKey(candidate), candidate])
  )

  return keys.flatMap((key) => {
    const candidate = candidateByKey.get(key)
    return candidate ? [candidate] : []
  })
}

/**
 * 譜面定数から表示レベルを生成する。
 *
 * @param chartConst - 譜面定数。
 * @returns レベル表記。
 */
export const formatRandomSongLevel = (chartConst: number): string => {
  const baseLevel = Math.floor(chartConst)
  const decimal = Math.round((chartConst - baseLevel) * 10)
  return decimal >= 5 ? `${baseLevel}+` : String(baseLevel)
}

/**
 * ユーザーレコードを譜面単位キーで参照できるMapへ変換する。
 *
 * @param records - 通常譜面のユーザーレコード。
 * @returns 譜面単位キーからレコードを引けるMap。
 */
export const createRandomSongRecordMap = (
  records: readonly PlayerRecordDTO[]
): Map<string, PlayerRecordDTO> =>
  new Map(records.map((record) => [createRandomSongChartKey(record.id, record.difficulty), record]))

/**
 * ユーザーレコードからランプ絞り込み用の代表ランプを解決する。
 *
 * @param record - 判定対象のユーザーレコード。
 * @returns AJC/AJ/FC/クリアランプ/未プレイのいずれか。
 */
export const resolveRandomSongRecordLamp = (
  record: PlayerRecordDTO | undefined
): RandomSongLampFilter => {
  if (record?.is_played !== true) return 'NONE'
  if (record.combo_lamp === 'ALL JUSTICE' && record.justice_count === 0) return 'AJC'
  if (record.combo_lamp === 'ALL JUSTICE') return 'AJ'
  if (record.combo_lamp === 'FULL COMBO') return 'FC'

  return record.clear_lamp ?? 'NONE'
}

/**
 * 楽曲一覧からランダム選曲の候補譜面一覧を生成する。
 *
 * @param songs - 通常楽曲一覧。
 * @param versions - バージョン一覧。
 * @returns 譜面単位のランダム選曲候補。
 */
export const buildRandomSongCandidates = (
  songs: readonly SongDTO[],
  versions: readonly VersionDTO[]
): RandomSongCandidate[] => {
  const candidates: RandomSongCandidate[] = []

  for (const song of songs) {
    const version = getShortVersionName(resolveVersionNameByReleaseDate(song.release, versions))

    for (const difficulty of RANDOM_SONG_SELECTOR_DIFFICULTIES) {
      const chart = song.charts[difficulty]
      if (!chart) continue

      candidates.push({
        song,
        difficulty,
        chartConst: chart.const,
        levelLabel: formatRandomSongLevel(chart.const),
        genre: song.genre,
        version,
      })
    }
  }

  return candidates
}

/**
 * ランダム選曲候補が楽曲ごとのOP対象譜面か判定する。
 *
 * @param candidate - 判定対象のランダム選曲候補。
 * @returns 楽曲マスタのOP対象難易度と候補難易度が一致する場合はtrue。
 */
export const isRandomSongOpTargetCandidate = (candidate: RandomSongCandidate): boolean =>
  candidate.song.op_target_difficulty === candidate.difficulty

/**
 * 難易度絞り込みの排他選択を反映した次の選択状態を作る。
 *
 * @param current - 現在選択中の難易度絞り込み値。
 * @param toggled - 切り替える難易度絞り込み値。
 * @returns OP対象と通常難易度が同時に選ばれない選択状態。
 */
export const toggleRandomSongDifficultyFilter = (
  current: readonly RandomSongDifficultyFilter[],
  toggled: RandomSongDifficultyFilter
): RandomSongDifficultyFilter[] => {
  if (toggled === RANDOM_SONG_OP_TARGET_FILTER) {
    return current.includes(RANDOM_SONG_OP_TARGET_FILTER) ? [] : [RANDOM_SONG_OP_TARGET_FILTER]
  }

  const withoutOpTarget = current.filter(
    (difficulty) => difficulty !== RANDOM_SONG_OP_TARGET_FILTER
  )
  return toggleRandomSongSelectionValue(withoutOpTarget, toggled)
}

/**
 * ランダム選曲候補を指定条件で絞り込む。
 *
 * @param candidates - 譜面単位の候補一覧。
 * @param filter - 難易度、ジャンル、バージョン、譜面定数の絞り込み条件。
 * @returns 条件に一致した候補一覧。
 */
export const filterRandomSongCandidates = (
  candidates: readonly RandomSongCandidate[],
  filter: RandomSongFilter
): RandomSongCandidate[] =>
  candidates.filter((candidate) => {
    const matchesDifficulty =
      filter.difficulties.includes(candidate.difficulty) ||
      (filter.difficulties.includes(RANDOM_SONG_OP_TARGET_FILTER) &&
        isRandomSongOpTargetCandidate(candidate))
    if (!matchesDifficulty) return false
    if (!filter.genres.includes(candidate.genre)) return false
    if (!filter.versions.includes(candidate.version)) return false
    if (filter.minConst !== null && candidate.chartConst < filter.minConst) return false
    if (filter.maxConst !== null && candidate.chartConst > filter.maxConst) return false

    return true
  })

/**
 * ランダム選曲候補を自分のレコード条件で絞り込む。
 *
 * @param candidates - 譜面単位の候補一覧。
 * @param recordsByChartKey - 譜面単位キーで引けるユーザーレコード。
 * @param bestChartKeys - ベスト枠に入っている譜面単位キー。
 * @param filter - プレイ状況、スコア、ベスト枠、ランプの絞り込み条件。
 * @returns 条件に一致した候補一覧。
 */
export const filterRandomSongCandidatesByRecord = (
  candidates: readonly RandomSongCandidate[],
  recordsByChartKey: ReadonlyMap<string, PlayerRecordDTO>,
  bestChartKeys: ReadonlySet<string>,
  filter: RandomSongRecordFilter
): RandomSongCandidate[] =>
  candidates.filter((candidate) => {
    const chartKey = createRandomSongChartKey(candidate.song.id, candidate.difficulty)
    const record = recordsByChartKey.get(chartKey)
    const isPlayed = record?.is_played === true
    const isBest = bestChartKeys.has(chartKey)

    if (filter.playStatus === 'played' && !isPlayed) return false
    if (filter.playStatus === 'unplayed' && isPlayed) return false
    if (filter.bestFrame === 'only' && !isBest) return false
    if (filter.bestFrame === 'exclude' && isBest) return false
    if (filter.minScore !== null || filter.maxScore !== null) {
      if (record?.is_played !== true) return false
      if (filter.minScore !== null && record.score < filter.minScore) return false
      if (filter.maxScore !== null && record.score > filter.maxScore) return false
    }
    if (!filter.lamps.includes(resolveRandomSongRecordLamp(record))) return false

    return true
  })

/**
 * 候補の重みを算出する。
 *
 * @param candidate - 抽選候補。
 * @param weight - 難易度別、定数別の倍率設定。
 * @returns 抽選に使う重み。0以下の場合は抽選対象外。
 */
export const resolveRandomSongWeight = (
  candidate: RandomSongCandidate,
  weight: RandomSongWeight = {}
): number => {
  const difficultyWeight = weight.difficultyWeights?.[candidate.difficulty] ?? 1
  const constWeight = weight.constWeights?.[formatChartConst(candidate.chartConst)] ?? 1

  return Math.max(0, difficultyWeight * constWeight)
}

/**
 * 候補一覧から重複なしでランダム選曲する。
 *
 * @param candidates - 抽選候補。
 * @param count - 抽選する件数。
 * @param weight - 難易度別、定数別の倍率設定。
 * @param random - 0以上1未満の乱数を返す関数。
 * @returns ランダムに選ばれた候補一覧。
 */
export const drawRandomSongs = (
  candidates: readonly RandomSongCandidate[],
  count: number,
  weight: RandomSongWeight = {},
  random: () => number = Math.random
): RandomSongCandidate[] => {
  const pool = candidates
    .map((candidate) => ({
      candidate,
      weight: resolveRandomSongWeight(candidate, weight),
    }))
    .filter((entry) => entry.weight > 0)
  const results: RandomSongCandidate[] = []
  const drawCount = Math.max(0, Math.min(Math.floor(count), pool.length))

  for (let drawIndex = 0; drawIndex < drawCount; drawIndex += 1) {
    const totalWeight = pool.reduce((sum, entry) => sum + entry.weight, 0)
    let threshold = random() * totalWeight
    let selectedIndex = pool.length - 1

    for (let index = 0; index < pool.length; index += 1) {
      threshold -= pool[index].weight
      if (threshold < 0) {
        selectedIndex = index
        break
      }
    }

    const [selected] = pool.splice(selectedIndex, 1)
    results.push(selected.candidate)
  }

  return results
}
