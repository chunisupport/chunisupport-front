import type {
  PlayerLockedSongRequest,
  PlayerLockedSongResponseItem,
  PlayerLockedSongsBatchRequest,
} from '../../types/api'
import type { OverPowerLockedSong } from './types'

/**
 * 未解禁楽曲の選択キーを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @param isUltima - ULTIMA譜面のみ未解禁にする場合はtrue。
 * @returns `displayId:mode` 形式の選択キー。
 */
export const createLockedSongKey = (displayId: string, isUltima: boolean): string =>
  `${displayId}:${isUltima ? 'ultima' : 'normal'}`

/**
 * 選択キーを未解禁楽曲の保存payloadへ変換する。
 *
 * @param keys - `displayId:mode` 形式の選択キー。
 * @returns 未解禁楽曲の保存payload。
 */
export const toLockedSongRequests = (keys: readonly string[]): OverPowerLockedSong[] =>
  keys.map((key) => {
    const [displayId, mode] = key.split(':')
    return {
      display_id: displayId,
      is_ultima: mode === 'ultima',
    }
  })

/**
 * 未解禁楽曲の保存項目を正規化する。
 *
 * @param item - 楽曲表示IDとULTIMA指定を持つ未解禁項目。
 * @returns is_ultimaを補完した保存payload。
 */
const toRequest = (
  item: Pick<PlayerLockedSongRequest, 'display_id' | 'is_ultima'>
): PlayerLockedSongRequest => ({
  display_id: item.display_id,
  is_ultima: item.is_ultima ?? false,
})

/**
 * 保存済み未解禁設定と編集結果から追加・削除差分を生成する。
 *
 * @param base - 保存済みの未解禁楽曲。
 * @param edited - 編集後の未解禁楽曲。
 * @returns 追加・削除がある項目だけを含むバッチ更新payload。
 */
export const buildLockedSongsBatchPayload = (
  base: PlayerLockedSongResponseItem[],
  edited: PlayerLockedSongRequest[]
): PlayerLockedSongsBatchRequest => {
  const baseMap = new Map(
    base.map((item) => [createLockedSongKey(item.display_id, item.is_ultima), item])
  )
  const editedMap = new Map(
    edited.map((item) => [createLockedSongKey(item.display_id, item.is_ultima ?? false), item])
  )

  const add = [...editedMap.entries()]
    .filter(([key]) => !baseMap.has(key))
    .map(([, item]) => toRequest(item))
  const del = [...baseMap.entries()]
    .filter(([key]) => !editedMap.has(key))
    .map(([, item]) => toRequest(item))

  const payload: PlayerLockedSongsBatchRequest = {}
  if (add.length > 0) payload.add = add
  if (del.length > 0) payload.delete = del
  return payload
}
