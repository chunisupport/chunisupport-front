import { createSignal } from 'solid-js'

/** トラック番号ごとの選曲。値は courseChartKey で作った譜面キー */
export type CoursePickKeys = ReadonlyMap<number, string>

const EMPTY_PICK_KEYS: CoursePickKeys = new Map()

// 楽曲詳細などへ移動して戻っても選曲を残すため、ページを開いている間だけモジュールで保持する
const [pickKeysByCourse, setPickKeysByCourse] = createSignal<ReadonlyMap<string, CoursePickKeys>>(
  new Map()
)

/**
 * コースのランダム枠で選曲中の譜面キーを返す。
 *
 * @param courseId - コースID。
 * @returns トラック番号ごとの譜面キー。未選曲は空。
 */
export const getCoursePickKeys = (courseId: string): CoursePickKeys =>
  pickKeysByCourse().get(courseId) ?? EMPTY_PICK_KEYS

/**
 * コースのランダム枠の選曲を置き換える。
 *
 * @param courseId - コースID。
 * @param keys - トラック番号ごとの譜面キー。空で全解除する。
 * @returns なし。
 */
export const saveCoursePickKeys = (courseId: string, keys: CoursePickKeys): void => {
  setPickKeysByCourse((current) => new Map(current).set(courseId, keys))
}
