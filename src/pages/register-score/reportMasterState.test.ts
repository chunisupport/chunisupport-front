import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveReportMasterState } from './reportMasterState'

test('表示対象の通常・WE・コースがすべて揃うまで画像化せず、取得失敗と再試行を区別する', () => {
  const required = new Set(['standard', 'worldsend', 'course'] as const)
  assert.equal(resolveReportMasterState(required, 'pending', 'ready', 'success'), 'pending')
  assert.equal(resolveReportMasterState(required, 'ready', 'errored', 'success'), 'error')
  assert.equal(resolveReportMasterState(required, 'ready', 'ready', 'error'), 'error')
  assert.equal(resolveReportMasterState(required, 'ready', 'ready', 'pending'), 'pending')
  assert.equal(resolveReportMasterState(required, 'ready', 'ready', 'success'), 'ready')
  assert.equal(
    resolveReportMasterState(new Set(['standard']), 'ready', 'errored', 'pending'),
    'ready'
  )
})
