import type { CourseDTO, CourseRecordDTO, UserCourseRecordsDTO } from '../types/api'
import type { PlayedCourseRecord, PlayedCourseRecords } from '../types/courseRecord'

/**
 * APIレスポンスからマスタ情報を除いたプレイ済みコースレコードを取り出す。
 *
 * @param response - APIから取得したコースレコードレスポンス。
 * @returns マスタとの結合前に扱うプレイ済みコースレコード。
 */
export const toPlayedCourseRecords = (response: UserCourseRecordsDTO): PlayedCourseRecords => ({
  courses: response.courses
    .filter((course) => course.is_played)
    .map((course) => ({
      display_id: course.display_id,
      score: course.score,
      is_clear: course.is_clear,
      combo_lamp: course.combo_lamp,
      updated_at: course.updated_at,
    })),
  meta: response.meta,
})

/**
 * コースマスタとプレイ済みレコードを結合し、未プレイコースを補完する。
 *
 * @param courses - 有効なコースマスタ一覧。
 * @param records - マスタ情報を除いたプレイ済みコースレコード。
 * @param updatedAt - 結合後レスポンスへ設定する更新日時。
 * @returns 全コースを含む画面表示用コースレコードレスポンス。
 */
export const mergeCourseRecords = (
  courses: CourseDTO[],
  records: PlayedCourseRecord[],
  updatedAt: string | null
): UserCourseRecordsDTO => {
  const recordByCourseId = new Map(records.map((record) => [record.display_id, record]))

  return {
    courses: courses.map((course): CourseRecordDTO => {
      const record = recordByCourseId.get(course.display_id)
      return {
        ...course,
        is_played: Boolean(record),
        score: record?.score ?? 0,
        is_clear: record?.is_clear ?? false,
        combo_lamp: record?.combo_lamp ?? null,
        updated_at: record?.updated_at ?? null,
      }
    }),
    meta: { updated_at: updatedAt },
  }
}

/**
 * 2つのISO 8601更新日時から新しい値を選ぶ。
 *
 * @param left - 比較する更新日時。
 * @param right - 比較する更新日時。
 * @returns 新しい更新日時。両方未設定の場合はnull。
 */
export const newerCourseUpdatedAt = (left: string | null, right: string | null): string | null => {
  if (!left) return right
  if (!right) return left

  const leftTimestamp = Date.parse(left)
  const rightTimestamp = Date.parse(right)
  if (Number.isNaN(leftTimestamp)) return right
  if (Number.isNaN(rightTimestamp)) return left

  return rightTimestamp > leftTimestamp ? right : left
}
