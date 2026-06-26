import assert from 'node:assert/strict'
import test from 'node:test'
import { CHUNITHM_JACKET_BASE_URL } from '../constants/jackets.ts'
import { buildChunithmJacketUrl } from './jacket.ts'

test('ジャケット画像IDからCHUNITHMジャケットURLを組み立てること', () => {
  // Given: APIから返されたジャケット画像ID。
  const imageId = 'music-jacket'

  // When: CHUNITHMジャケットURLを組み立てる。
  const result = buildChunithmJacketUrl(imageId)

  // Then: CHUNITHMジャケット配信先のwebp URLになる。
  assert.equal(result, `${CHUNITHM_JACKET_BASE_URL}/music-jacket.webp`)
})

test('空白だけのジャケット画像IDはジャケットURLを返さないこと', () => {
  // Given: APIから空白だけのジャケット画像IDが返された状態。
  const imageId = '   '

  // When: CHUNITHMジャケットURLを組み立てる。
  const result = buildChunithmJacketUrl(imageId)

  // Then: 背景画像なしとして扱う。
  assert.equal(result, null)
})

test('nullのジャケット画像IDはジャケットURLを返さないこと', () => {
  // Given: ジャケット画像IDが存在しない状態。
  const imageId = null

  // When: CHUNITHMジャケットURLを組み立てる。
  const result = buildChunithmJacketUrl(imageId)

  // Then: 画像なしとして扱う。
  assert.equal(result, null)
})
