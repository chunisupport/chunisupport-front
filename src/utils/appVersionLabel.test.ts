import assert from 'node:assert/strict'
import test from 'node:test'
import { formatBuildRevisionLabel, normalizeBuildDate } from './appVersionLabel'

test('normalizeBuildDate: ISO 形式のビルド日時を YYYYMMDD に変換する', () => {
  assert.equal(normalizeBuildDate('2026-06-14T00:00:00.000Z'), '20260614')
})

test('formatBuildRevisionLabel: ビルド日とコミットハッシュを表示する', () => {
  const result = formatBuildRevisionLabel({
    appName: 'Frontend',
    buildDate: '20260614',
    commitHash: 'abcdef0',
  })

  assert.equal(result, 'Frontend: 20260614 (abcdef0)')
})
