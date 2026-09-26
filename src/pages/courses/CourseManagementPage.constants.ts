import { formatMessage, localizedCopy } from '../../i18n'
/** コース管理画面で使用する表示文言 */
export const COURSE_MANAGEMENT_COPY = localizedCopy('courses.courseManagementCopy')

/** コース入力のAPI制約 */
export const COURSE_INPUT_LIMITS = {
  idx: 32,
  name: 255,
} as const

/**
 * コース編集ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの編集ラベル。
 */
export const formatCourseEditLabel = (courseName: string): string =>
  formatMessage(COURSE_MANAGEMENT_COPY.editLabel, { name: courseName })

/**
 * コース削除ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの削除ラベル。
 */
export const formatCourseDeleteLabel = (courseName: string): string =>
  formatMessage(COURSE_MANAGEMENT_COPY.deleteLabel, { name: courseName })

/**
 * コース復元ボタンのアクセシブルなラベルを生成する。
 *
 * @param courseName - 対象コース名。
 * @returns スクリーンリーダー向けの復元ラベル。
 */
export const formatCourseRestoreLabel = (courseName: string): string =>
  formatMessage(COURSE_MANAGEMENT_COPY.restoreLabel, { name: courseName })
