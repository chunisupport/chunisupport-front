import type { CourseRecordDTO, UserRecordMetaDTO } from './api'

/** コースマスタ由来の項目を除いたプレイ済みコースレコード */
export type PlayedCourseRecord = Pick<
  CourseRecordDTO,
  'display_id' | 'score' | 'is_clear' | 'combo_lamp' | 'updated_at'
>

/** マスタ情報を除いたプレイ済みコースレコード一覧 */
export type PlayedCourseRecords = {
  courses: PlayedCourseRecord[]
  meta: UserRecordMetaDTO
}
