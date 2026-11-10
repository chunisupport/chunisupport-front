import assert from 'node:assert/strict'
import test from 'node:test'
import { isFriendshipSlotsFull } from './friendshipSlots'

test('isFriendshipSlotsFull: 使用数が上限未満なら満杯ではない', () => {
  // Given: 空きがあるフレンド枠。
  const slots = { limit: 100, used: 99 }

  // When: 満杯か判定する。
  const result = isFriendshipSlotsFull(slots)

  // Then: 満杯ではない。
  assert.equal(result, false)
})

test('isFriendshipSlotsFull: 使用数が上限に達していれば満杯', () => {
  // Given: 使用数が上限ちょうどのフレンド枠。
  const slots = { limit: 100, used: 100 }

  // When: 満杯か判定する。
  const result = isFriendshipSlotsFull(slots)

  // Then: 満杯になる。
  assert.equal(result, true)
})

test('isFriendshipSlotsFull: 枠が未取得なら満杯扱いにしない', () => {
  // Given: 取得前または取得失敗で枠がない状態。
  const slots = undefined

  // When: 満杯か判定する。
  const result = isFriendshipSlotsFull(slots)

  // Then: 操作を止めないよう満杯ではない扱いになる。
  assert.equal(result, false)
})
