import assert from 'node:assert/strict'
import test from 'node:test'

import { buildWorldsendSongDetailPath } from './worldsendNavigation.ts'

test("WORLD'S END レコードから楽曲詳細への導線は専用詳細ページを指す", () => {
  assert.equal(buildWorldsendSongDetailPath('abc123'), '/songs/worldsend/abc123')
})

test('display id は URL セーフにエンコードされる', () => {
  assert.equal(buildWorldsendSongDetailPath('A/B C'), '/songs/worldsend/A%2FB%20C')
})
