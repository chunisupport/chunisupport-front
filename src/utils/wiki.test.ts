import assert from 'node:assert/strict'
import test from 'node:test'
import { buildWikiPageUrl } from './wiki.ts'

const TEST_WIKI_BASE_URL = 'https://wiki.example.com/chunithm/'

test('ページタイトルをエンコードしてWikiページURLを組み立てること', () => {
  // Given: 記号と日本語を含むページタイトル。
  const pageTitle = '楽曲 #1 & ?'

  // When: WikiページURLを組み立てる。
  const result = buildWikiPageUrl(TEST_WIKI_BASE_URL, pageTitle)

  // Then: ベースURLの後ろにエンコード済みのページタイトルが付く。
  assert.equal(result, 'https://wiki.example.com/chunithm/%E6%A5%BD%E6%9B%B2%20%231%20%26%20%3F')
})

test('ページタイトルのスラッシュは階層区切りとして維持すること', () => {
  // Given: 階層を含むページタイトル。
  const pageTitle = "楽曲/WORLD'S END"

  // When: WikiページURLを組み立てる。
  const result = buildWikiPageUrl(TEST_WIKI_BASE_URL, pageTitle)

  // Then: スラッシュはエンコードされずに残る。
  assert.equal(result, "https://wiki.example.com/chunithm/%E6%A5%BD%E6%9B%B2/WORLD'S%20END")
})

test('ベースURLの末尾スラッシュ有無に関わらず区切りが1つになること', () => {
  // Given: 末尾スラッシュのないベースURL。
  const baseUrl = 'https://wiki.example.com/chunithm'

  // When: WikiページURLを組み立てる。
  const result = buildWikiPageUrl(baseUrl, 'Title')

  // Then: ベースURLとページタイトルの間の区切りは1つになる。
  assert.equal(result, 'https://wiki.example.com/chunithm/Title')
})

test('ページタイトルが未設定または空白の場合はnullを返すこと', () => {
  // Given: 未設定・空白のページタイトル。
  const pageTitles = [null, undefined, '   ']

  // When: WikiページURLを組み立てる。
  const results = pageTitles.map((pageTitle) => buildWikiPageUrl(TEST_WIKI_BASE_URL, pageTitle))

  // Then: いずれもリンクなしとして扱う。
  assert.deepEqual(results, [null, null, null])
})

test('ベースURLが未設定の場合はnullを返すこと', () => {
  // Given: WikiのベースURLが未設定の環境。
  const baseUrl = undefined

  // When: WikiページURLを組み立てる。
  const result = buildWikiPageUrl(baseUrl, 'Title')

  // Then: リンクなしとして扱う。
  assert.equal(result, null)
})
