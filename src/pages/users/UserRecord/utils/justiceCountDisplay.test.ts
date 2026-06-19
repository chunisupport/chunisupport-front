import assert from 'node:assert/strict'
import test from 'node:test'

import { formatJusticeCountForAj } from './justiceCountDisplay.ts'

test('AJ以外はJUSTICE数を表示しない', () => {
  // Given: FULL COMBOでAPIのJUSTICE数がnullのレコード
  const params = { comboLamp: 'FULL COMBO' as const, justiceCount: null }

  // When: 表示用のJUSTICE数へ整形する
  const result = formatJusticeCountForAj(params)

  // Then: 空文字が返る
  assert.equal(result, '')
})

test('AJでJUSTICE数がnullの場合はハイフンを表示する', () => {
  // Given: ALL JUSTICEだがAPIのJUSTICE数がnullのレコード
  const params = { comboLamp: 'ALL JUSTICE' as const, justiceCount: null }

  // When: 表示用のJUSTICE数へ整形する
  const result = formatJusticeCountForAj(params)

  // Then: ハイフンが返る
  assert.equal(result, '-')
})

test('AJでJUSTICE数がある場合はAPIの値を表示する', () => {
  // Given: ALL JUSTICEでAPIのJUSTICE数があるレコード
  const params = { comboLamp: 'ALL JUSTICE' as const, justiceCount: 2 }

  // When: 表示用のJUSTICE数へ整形する
  const result = formatJusticeCountForAj(params)

  // Then: APIのJUSTICE数が返る
  assert.equal(result, 2)
})
