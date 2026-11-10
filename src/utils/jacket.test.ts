import assert from 'node:assert/strict'
import test from 'node:test'

const TEST_CHUNITHM_JACKET_BASE_URL = 'https://jacket.example.com/chunithm'
process.env.PUBLIC_CHUNITHM_JACKET_BASE_URL = TEST_CHUNITHM_JACKET_BASE_URL

const { buildChunithmJacketRetryUrl, buildChunithmJacketUrl } = await import('./jacket.ts')

test('ジャケット画像IDからCHUNITHMジャケットURLを組み立てること', () => {
  // Given: APIから返されたジャケット画像ID。
  const imageId = 'music-jacket'

  // When: CHUNITHMジャケットURLを組み立てる。
  const result = buildChunithmJacketUrl(imageId)

  // Then: CHUNITHMジャケット配信先のwebp URLになる。
  assert.equal(result, `${TEST_CHUNITHM_JACKET_BASE_URL}/music-jacket.webp`)
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

test('失敗したジャケットURLへ再取得キーを追加すること', () => {
  // Given: 取得に失敗したジャケットURLと訪問固有の再取得キー。
  const sourceUrl = `${TEST_CHUNITHM_JACKET_BASE_URL}/music-jacket.webp`

  // When: HTTPキャッシュを回避するURLを組み立てる。
  const result = buildChunithmJacketRetryUrl(sourceUrl, 'retry-key')

  // Then: retryクエリ付きのURLになる。
  assert.equal(result, `${sourceUrl}?retry=retry-key`)
})

test('再取得URLは既存のクエリとハッシュを保持すること', () => {
  // Given: 既存クエリとハッシュを含むジャケットURL。
  const sourceUrl = `${TEST_CHUNITHM_JACKET_BASE_URL}/music-jacket.webp?size=large#preview`

  // When: HTTPキャッシュを回避するURLを組み立てる。
  const result = buildChunithmJacketRetryUrl(sourceUrl, 'retry-key')

  // Then: 既存要素を保ったままretryクエリだけが追加される。
  assert.equal(
    result,
    `${TEST_CHUNITHM_JACKET_BASE_URL}/music-jacket.webp?size=large&retry=retry-key#preview`
  )
})
