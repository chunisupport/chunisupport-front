import { WORLDSEND_SCORE_LABEL } from '../constants/chart'
import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../constants/routes'
import type {
  CourseChartRefDTO,
  CourseTrackFilterDTO,
  PlayerRecordDTO,
  UserRecordDTO,
  WorldsendChartDTO,
  WorldsendRecordDTO,
} from '../types/api'

/** コース楽曲に表示する譜面ごとの自己ベストとランプ状態 */
export type CourseTrackBestRecord = Pick<
  PlayerRecordDTO | WorldsendRecordDTO,
  'score' | 'clear_lamp' | 'combo_lamp' | 'full_chain'
>

/**
 * コース譜面を自己ベスト・選択状態と照合するためのキーを作る。
 *
 * @param chart - 曲の公開IDと難易度。
 * @returns 曲と難易度の組を表すキー。
 */
export const courseChartKey = (chart: CourseChartRefDTO): string =>
  `${chart.id}:${chart.difficulty}`

/**
 * レベル・ジャンル条件を短い表示文字列に整える。
 *
 * @param filter - ランダム選曲のレベル・ジャンル条件。
 * @returns カードやプレビュー向けの条件表示。条件が何もない場合は空文字。
 */
export const formatCourseTrackFilter = ({
  min_level: min,
  max_level: max,
  genres,
}: CourseTrackFilterDTO): string => {
  let level = ''
  if (min && max) level = min === max ? `Lv.${min}` : `Lv.${min}〜${max}`
  else if (min) level = `Lv.${min}以上`
  else if (max) level = `Lv.${max}以下`
  return [level, genres?.join('・')].filter(Boolean).join(' / ')
}

/**
 * コース内の通常譜面とWORLD'S ENDのレコードを、公開IDと難易度で照合できる形にする。
 *
 * @param records - ユーザーの楽曲レコード。
 * @returns プレイ済み譜面だけを含む自己ベストとランプ状態のマップ。
 */
export const buildCourseTrackBestRecords = (
  records: UserRecordDTO
): ReadonlyMap<string, CourseTrackBestRecord> => {
  const bestRecords = new Map<string, CourseTrackBestRecord>()
  for (const chart of records.standard) {
    if (chart.is_played) {
      bestRecords.set(courseChartKey(chart), {
        score: chart.score,
        clear_lamp: chart.clear_lamp,
        combo_lamp: chart.combo_lamp,
        full_chain: chart.full_chain,
      })
    }
  }
  for (const chart of records.worldsend ?? []) {
    if (chart.is_played) {
      bestRecords.set(courseChartKey({ id: chart.id, difficulty: 'WORLDSEND' }), {
        score: chart.score,
        clear_lamp: chart.clear_lamp,
        combo_lamp: chart.combo_lamp,
        full_chain: chart.full_chain,
      })
    }
  }
  return bestRecords
}

/**
 * コース譜面に対応する楽曲詳細へのリンクを作る。
 *
 * @param chart - 曲の公開IDと難易度。
 * @returns 通常楽曲またはWORLD'S ENDの詳細パス。
 */
export const getCourseTrackSongPath = (chart: CourseChartRefDTO): string =>
  chart.difficulty === 'WORLDSEND'
    ? buildWorldsendSongDetailPath(chart.id)
    : buildSongDetailPath(chart.id, chart.difficulty)

/**
 * WORLD'S END譜面の属性と星数を連結した短い表記を作る。
 *
 * @param attribute - 属性名。
 * @param levelStar - 星数。
 * @returns 「属性★星数」の表記。どちらもなければ空文字。
 */
export const formatWorldsendAttributeStar = (
  attribute: string | null,
  levelStar: number | null
): string => [attribute, levelStar === null ? undefined : `★${levelStar}`].filter(Boolean).join('')

/**
 * 同名のWORLD'S END譜面を見分けるための譜面情報を作る。
 *
 * @param chart - 属性、星数、ノーツ数。
 * @returns WORLD'S ENDの譜面情報。
 */
export const formatCourseWorldsendChart = ({
  attribute,
  level_star: levelStar,
  notes,
}: WorldsendChartDTO): string =>
  [
    formatWorldsendAttributeStar(attribute, levelStar) || WORLDSEND_SCORE_LABEL,
    notes === null ? undefined : `${notes.toLocaleString('ja-JP')} NOTES`,
  ]
    .filter(Boolean)
    .join(' / ')
