import type { PlayerDataDifficulty, PlayerRecordDTO, SongDTO, VersionDTO } from '../types/api'
import { getShortVersionName, resolveVersionNameByReleaseDate } from './versionConverter'

export type RandomSongCandidate = {
  song: SongDTO
  difficulty: PlayerDataDifficulty
  chartConst: number
  levelLabel: string
  genre: string
  version: string
}

export type RandomSongFilter = {
  difficulties: readonly PlayerDataDifficulty[]
  genres: readonly string[]
  versions: readonly string[]
  minConst: number | null
  maxConst: number | null
}

export type RandomSongWeight = {
  difficultyWeights?: Partial<Record<PlayerDataDifficulty, number>>
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

const RANDOM_SELECTOR_DIFFICULTIES: PlayerDataDifficulty[] = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
]

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

    for (const difficulty of RANDOM_SELECTOR_DIFFICULTIES) {
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
    if (!filter.difficulties.includes(candidate.difficulty)) return false
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
    if (filter.minScore !== null && (record?.score ?? 0) < filter.minScore) return false
    if (filter.maxScore !== null && (record?.score ?? 0) > filter.maxScore) return false
    if (!filter.lamps.includes(resolveRandomSongRecordLamp(record))) return false

    return true
  })

/**
 * 候補の重みを算出する。
 *
 * @param candidate - 抽選候補。
 * @param weight - 難易度別の重み設定。
 * @returns 抽選に使う重み。0以下の場合は抽選対象外。
 */
export const resolveRandomSongWeight = (
  candidate: RandomSongCandidate,
  weight: RandomSongWeight = {}
): number => {
  const difficultyWeight = weight.difficultyWeights?.[candidate.difficulty] ?? 1

  return Math.max(0, difficultyWeight)
}

/**
 * 候補一覧から重複なしでランダム選曲する。
 *
 * @param candidates - 抽選候補。
 * @param count - 抽選する件数。
 * @param weight - 難易度別の重み設定。
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
