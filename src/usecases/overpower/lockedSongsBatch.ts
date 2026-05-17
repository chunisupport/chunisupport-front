import type {
  PlayerLockedSongRequest,
  PlayerLockedSongResponseItem,
  PlayerLockedSongsBatchRequest,
} from '../../types/api'

const createLockedSongKey = (displayId: string, isUltima: boolean): string =>
  `${displayId}:${isUltima ? 'ultima' : 'normal'}`

const toRequest = (
  item: Pick<PlayerLockedSongRequest, 'display_id' | 'is_ultima'>
): PlayerLockedSongRequest => ({
  display_id: item.display_id,
  is_ultima: item.is_ultima ?? false,
})

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
