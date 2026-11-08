import type { FriendshipSlotsResponse } from '../types/api'

/**
 * フレンド枠が満杯かを判定する。
 * 満杯なら申請・承認はAPIで `friendship_limit_exceeded` になるため、画面側で操作を止めるのに使う。
 * 枠は表示の補助なので、未取得（取得前・取得失敗）の場合は満杯扱いにせず操作を止めない。
 *
 * @param slots - フレンド枠の上限と使用数。未取得の場合は undefined。
 * @returns 使用数が上限に達していれば true。
 */
export const isFriendshipSlotsFull = (slots: FriendshipSlotsResponse | undefined): boolean =>
  slots !== undefined && slots.used >= slots.limit
