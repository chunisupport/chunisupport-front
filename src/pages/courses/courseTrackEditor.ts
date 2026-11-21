import { COURSE_TRACK_NUMBERS } from '../../constants/courseTracks'
import type { CourseChartRefDTO, CourseTrackDTO, CourseTrackSelectionType } from '../../types/api'
import type { ChartLevelLabel } from '../../utils/chartLevel'
import { getChartLevelSortKey } from '../../utils/chartLevel'
import { courseChartKey } from '../../utils/courseTracks'
import { COURSE_TRACK_EDITOR_COPY } from './courseTrackEditor.constants.ts'

/** 方式ごとの入力を保持するトラック編集用の状態。 */
export interface CourseTrackDraft {
  trackNumber: number
  selectionType: CourseTrackSelectionType
  minLevel: string | null
  maxLevel: string | null
  genres: string[]
  charts: CourseChartRefDTO[]
}

/**
 * 登録済みの構成をトラック番号順の編集状態にする。
 *
 * @param tracks - APIから取得した登録内容。
 * @returns 独立した3枠の編集状態。
 */
export const createCourseTrackDrafts = (tracks: readonly CourseTrackDTO[]): CourseTrackDraft[] =>
  COURSE_TRACK_NUMBERS.map((trackNumber) => {
    const track = tracks.find((item) => item.track_no === trackNumber)
    const filter = track?.selection_type === 'RANDOM_FILTER' ? track.filter : undefined

    return {
      trackNumber,
      selectionType: track?.selection_type ?? 'FIXED',
      minLevel: filter?.min_level ?? null,
      maxLevel: filter?.max_level ?? null,
      genres: [...(filter?.genres ?? [])],
      charts: track && track.selection_type !== 'RANDOM_FILTER' ? [...track.charts] : [],
    }
  })

/**
 * 現在の選曲方式に必要な入力を検証する。
 *
 * @param track - 検証するトラック。
 * @returns 入力エラーの表示文言。妥当ならundefined。
 */
export const validateCourseTrackDraft = (track: CourseTrackDraft): string | undefined => {
  if (track.selectionType === 'RANDOM_FILTER') {
    if (!track.minLevel && !track.maxLevel && track.genres.length === 0) {
      return COURSE_TRACK_EDITOR_COPY.emptyFilterError
    }
    if (
      track.minLevel &&
      track.maxLevel &&
      getChartLevelSortKey(track.minLevel as ChartLevelLabel) >
        getChartLevelSortKey(track.maxLevel as ChartLevelLabel)
    ) {
      return COURSE_TRACK_EDITOR_COPY.levelRangeError
    }
  } else {
    if (track.selectionType === 'FIXED' && track.charts.length !== 1) {
      return COURSE_TRACK_EDITOR_COPY.fixedChartError
    }
    if (track.selectionType === 'RANDOM_POOL' && track.charts.length === 0) {
      return COURSE_TRACK_EDITOR_COPY.poolChartError
    }
  }
  return undefined
}

/**
 * 選んだ譜面で固定枠を置き換えるか、プールへ重複なしで追加する。
 *
 * @param track - 編集中のトラック。
 * @param chart - 選択した譜面。
 * @returns 選択後の譜面一覧。
 */
export const addCourseTrackChart = (
  track: CourseTrackDraft,
  chart: CourseChartRefDTO
): CourseChartRefDTO[] => {
  if (track.selectionType === 'FIXED') return [chart]
  return track.charts.some((item) => courseChartKey(item) === courseChartKey(chart))
    ? track.charts
    : [...track.charts, chart]
}

/**
 * 検証済みのトラックから選曲方式に該当する項目だけを組み立てる。
 *
 * @param track - 検証済みの入力値。
 * @returns コース構成更新APIに送るトラック。
 */
export const toCourseTrackRequest = (track: CourseTrackDraft): CourseTrackDTO => {
  const track_no = track.trackNumber

  switch (track.selectionType) {
    case 'RANDOM_FILTER':
      return {
        track_no,
        selection_type: track.selectionType,
        filter: {
          min_level: track.minLevel ?? undefined,
          max_level: track.maxLevel ?? undefined,
          genres: track.genres.length ? track.genres : undefined,
        },
      }
    case 'RANDOM_POOL':
      return {
        track_no,
        selection_type: track.selectionType,
        charts: track.charts,
      }
    case 'FIXED':
      return { track_no, selection_type: track.selectionType, charts: track.charts }
  }
}
