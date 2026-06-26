import assert from 'node:assert/strict'
import test from 'node:test'
import { CHUNITHM_JACKET_BASE_URL } from '../../../../constants/jackets'
import { buildRatingRecordJacketUrl } from './ratingRecordJacket'

test('ジャケット画像IDからレーティングカード背景用URLを組み立てること', () => {
  // Given: APIから返されたジャケット画像ID。
  const imageId = 'music-jacket'

  // When: レーティングカード背景用URLを組み立てる。
  const result = buildRatingRecordJacketUrl(imageId)

  // Then: CHUNITHMジャケット配信先のwebp URLになる。
  assert.equal(result, `${CHUNITHM_JACKET_BASE_URL}/music-jacket.webp`)
})

test('空白だけのジャケット画像IDは背景表示しないこと', () => {
  // Given: APIから空白だけのジャケット画像IDが返された状態。
  const imageId = '   '

  // When: レーティングカード背景用URLを組み立てる。
  const result = buildRatingRecordJacketUrl(imageId)

  // Then: 背景画像なしとして扱う。
  assert.equal(result, null)
})
