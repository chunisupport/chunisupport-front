import type { Resource } from 'solid-js'
import type { PlayerDataRecordChange } from '../../types/api'

/** 対象差分に必要なマスタのみを評価し、共有画像を生成できる状態を返す。 */
export const resolveReportMasterState = (
  required: ReadonlySet<PlayerDataRecordChange['record_type']>,
  standard: Resource<unknown>['state'],
  worldsend: Resource<unknown>['state'],
  course: 'pending' | 'success' | 'error'
): 'ready' | 'pending' | 'error' => {
  const states = [
    ...(required.has('standard') ? [standard] : []),
    ...(required.has('worldsend') ? [worldsend] : []),
    ...(required.has('course') ? [course] : []),
  ]
  if (states.some((state) => state === 'errored' || state === 'error')) return 'error'
  return states.every((state) => state === 'ready' || state === 'success') ? 'ready' : 'pending'
}
