import assert from 'node:assert/strict'
import test from 'node:test'
import { computeDropSlotOffsetY } from './goalCardDropSlot'

test('移動先が自分自身の場合はずれが 0 になること', () => {
  // Given
  const source = { top: 100, bottom: 200 }

  // When
  const offset = computeDropSlotOffsetY(source, source)

  // Then
  assert.equal(offset, 0)
})

test('上へ移動する場合は移動先カードの上端にそろうこと', () => {
  // Given: 高さ 100px のカードを、その上にある高さ 300px のカードの位置へ移動する
  const source = { top: 312, bottom: 412 }
  const target = { top: 0, bottom: 300 }

  // When
  const offset = computeDropSlotOffsetY(source, target)

  // Then
  assert.equal(offset, -312)
})

test('下へ移動する場合は移動先カードの下端にそろうこと', () => {
  // Given: 高さ 300px のカードを、その下にある高さ 100px のカードの位置へ移動する
  const source = { top: 0, bottom: 300 }
  const target = { top: 312, bottom: 412 }

  // When
  const offset = computeDropSlotOffsetY(source, target)

  // Then: 移動後は 112px〜412px に入る
  assert.equal(offset, 112)
})

test('高さが同じカード同士では移動先カードの位置にそのまま重なること', () => {
  // Given
  const source = { top: 0, bottom: 100 }
  const target = { top: 224, bottom: 324 }

  // When
  const offset = computeDropSlotOffsetY(source, target)

  // Then
  assert.equal(offset, target.top - source.top)
})

test('上端が同じ位置の場合は上端にそろえてずれが 0 になること', () => {
  // Given: 上端は同じで高さだけが異なる移動先
  const source = { top: 100, bottom: 200 }
  const target = { top: 100, bottom: 250 }

  // When
  const offset = computeDropSlotOffsetY(source, target)

  // Then
  assert.equal(offset, 0)
})
