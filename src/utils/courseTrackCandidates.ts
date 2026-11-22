import { PLAYER_DATA_DIFFICULTY_ORDER } from '../constants/difficulty'
import type { CourseDetailDTO, CourseTrackCandidateDTO } from '../types/api'
import { type CourseTrackBestRecord, courseChartKey } from './courseTracks'
import { parseNumberInput } from './rangeInput'
import { normalizeForSearch, normalizeQuery } from './searchUtils'
import type { SortDirection } from './sortingQuery'

/** 候補譜面の難易度。WORLD'S ENDを含む */
export type CourseCandidateDifficulty = CourseTrackCandidateDTO['difficulty']

/** 候補譜面の並び順。default はAPIの返却順 */
export type CourseCandidateSortKey = 'default' | 'title' | 'const' | 'score'

/** 候補譜面の絞り込み条件。スコアの空文字は上限・下限なしを表す */
export type CourseCandidateFilter = {
  query: string
  difficulties: readonly CourseCandidateDifficulty[]
  scoreMin: string
  scoreMax: string
}

/** 候補譜面の並び替え条件 */
export type CourseCandidateSort = {
  key: CourseCandidateSortKey
  direction: SortDirection
}

/** 難易度の表示順。WORLD'S ENDは通常難易度の後に置く */
const DIFFICULTY_ORDER: Readonly<Record<CourseCandidateDifficulty, number>> = {
  ...PLAYER_DATA_DIFFICULTY_ORDER,
  WORLDSEND: 5,
}

/**
 * 候補譜面に含まれる難易度を正規順で重複なく返す。
 *
 * @param candidates - 候補譜面。
 * @returns 候補に存在する難易度。
 */
export const listCourseCandidateDifficulties = (
  candidates: readonly CourseTrackCandidateDTO[]
): CourseCandidateDifficulty[] =>
  [...new Set(candidates.map((chart) => chart.difficulty))].sort(
    (left, right) => DIFFICULTY_ORDER[left] - DIFFICULTY_ORDER[right]
  )

/**
 * 並び替えに使う値を返す。値がない譜面は null とし、方向に関わらず末尾へ置く。
 *
 * @param chart - 候補譜面。
 * @param key - 並び替えキー。
 * @param score - 自己ベストスコア。未プレイは undefined。
 * @returns 比較値。
 */
const sortValue = (
  chart: CourseTrackCandidateDTO,
  key: Exclude<CourseCandidateSortKey, 'default' | 'title'>,
  score: number | undefined
): number | null => {
  if (key === 'score') return score ?? null
  return chart.difficulty === 'WORLDSEND' ? null : chart.const
}

/**
 * 候補譜面を検索語・難易度・自己ベストスコアで絞り込み、指定キーで安定ソートする。
 * 未プレイの譜面はスコア0として絞り込む。
 *
 * @param candidates - 候補譜面（APIの返却順）。
 * @param records - 譜面キーごとの自己ベスト。未取得時は undefined。
 * @param filter - 絞り込み条件。
 * @param sort - 並び替え条件。
 * @returns 条件に合う候補譜面。
 */
export const filterAndSortCourseCandidates = (
  candidates: readonly CourseTrackCandidateDTO[],
  records: ReadonlyMap<string, CourseTrackBestRecord> | undefined,
  filter: CourseCandidateFilter,
  sort: CourseCandidateSort
): CourseTrackCandidateDTO[] => {
  const { normalizedQuery } = normalizeQuery(filter.query)
  const difficulties = new Set(filter.difficulties)
  const scoreMin = parseNumberInput(filter.scoreMin) ?? Number.NEGATIVE_INFINITY
  const scoreMax = parseNumberInput(filter.scoreMax) ?? Number.POSITIVE_INFINITY

  const rows = candidates
    .map((chart, index) => ({ chart, index, score: records?.get(courseChartKey(chart))?.score }))
    .filter(
      ({ chart, score }) =>
        difficulties.has(chart.difficulty) &&
        normalizeForSearch(chart.title).includes(normalizedQuery) &&
        (score ?? 0) >= scoreMin &&
        (score ?? 0) <= scoreMax
    )

  if (sort.key === 'default') return rows.map(({ chart }) => chart)
  const sign = sort.direction === 'asc' ? 1 : -1
  const key = sort.key
  return rows
    .sort((left, right) => {
      if (key === 'title') {
        return (
          sign * left.chart.title.localeCompare(right.chart.title, 'ja') || left.index - right.index
        )
      }
      const leftValue = sortValue(left.chart, key, left.score)
      const rightValue = sortValue(right.chart, key, right.score)
      if (leftValue === null || rightValue === null) {
        return (
          (leftValue === null ? 1 : 0) - (rightValue === null ? 1 : 0) || left.index - right.index
        )
      }
      return sign * (leftValue - rightValue) || left.index - right.index
    })
    .map(({ chart }) => chart)
}

/**
 * 候補譜面から1件を無作為に選ぶ。
 *
 * @param candidates - 候補譜面。
 * @param random - 0以上1未満の乱数を返す関数。テストで差し替える。
 * @returns 選ばれた譜面。候補がない場合は undefined。
 */
export const pickRandomCourseCandidate = (
  candidates: readonly CourseTrackCandidateDTO[],
  random: () => number = Math.random
): CourseTrackCandidateDTO | undefined => candidates[Math.floor(random() * candidates.length)]

/**
 * 保存した譜面キーを、現在の候補譜面へ戻す。
 * 固定枠や、候補から外れた譜面のキーは捨てる。
 *
 * @param tracks - コースのトラック定義。
 * @param pickKeys - トラック番号ごとの譜面キー。
 * @returns トラック番号ごとの選曲中の譜面。
 */
export const resolveCoursePicks = (
  tracks: readonly CourseDetailDTO['tracks'][number][],
  pickKeys: ReadonlyMap<number, string>
): Map<number, CourseTrackCandidateDTO> =>
  new Map(
    tracks.flatMap((track) => {
      const key = pickKeys.get(track.track_no)
      const chart =
        key && track.selection_type !== 'FIXED'
          ? track.candidates.find((candidate) => courseChartKey(candidate) === key)
          : undefined
      return chart ? [[track.track_no, chart] as const] : []
    })
  )
