import assert from 'node:assert/strict'
import test from 'node:test'
import { suppressNextClick } from './suppressNextClick'

/**
 * click イベントを発火し、後続のリスナーまで届いたかを返す。
 *
 * @param target - click を発火する対象。
 * @returns 発火した click と、後続リスナーへの到達有無。
 */
const dispatchClick = (target: EventTarget): { event: Event; reached: boolean } => {
  let reached = false
  const listener = () => {
    reached = true
  }
  target.addEventListener('click', listener)
  const event = new Event('click', { cancelable: true })
  target.dispatchEvent(event)
  target.removeEventListener('click', listener)
  return { event, reached }
}

test('suppressNextClick は直後の click を1回だけ打ち消すこと', () => {
  // Given
  const target = new EventTarget()
  suppressNextClick(target)

  // When
  const first = dispatchClick(target)
  const second = dispatchClick(target)

  // Then
  assert.equal(first.event.defaultPrevented, true)
  assert.equal(first.reached, false)
  assert.equal(second.event.defaultPrevented, false)
  assert.equal(second.reached, true)
})

test('suppressNextClick はタイムアウト後の click を打ち消さないこと', async () => {
  // Given
  const target = new EventTarget()
  suppressNextClick(target, 0)

  // When
  await new Promise((resolve) => setTimeout(resolve, 10))
  const result = dispatchClick(target)

  // Then
  assert.equal(result.event.defaultPrevented, false)
  assert.equal(result.reached, true)
})

test('suppressNextClick の戻り値で監視を即時解除できること', () => {
  // Given
  const target = new EventTarget()
  const dispose = suppressNextClick(target)

  // When
  dispose()
  const result = dispatchClick(target)

  // Then
  assert.equal(result.reached, true)
})
