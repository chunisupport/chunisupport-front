import { normalizeSongReading } from './songReading'

const symbolOrSpaceRegex = /[\p{P}\p{S}\p{Z}\p{Cf}]/gu
const voicedMarkRegex = /[\u3099\u309A]/gu
const prolongedSoundMarkRegex = /[ーｰ]/g
const trailingFullwidthAlphabetRegex = /[Ａ-Ｚａ-ｚ]$/u
/** 小書きのカナから対応する大きいカナへの対応表 */
const SMALL_TO_LARGE_KANA: Record<string, string> = {
  ぁ: 'あ',
  ぃ: 'い',
  ぅ: 'う',
  ぇ: 'え',
  ぉ: 'お',
  っ: 'つ',
  ゃ: 'や',
  ゅ: 'ゆ',
  ょ: 'よ',
  ゎ: 'わ',
  ゕ: 'か',
  ゖ: 'け',
  ァ: 'ア',
  ィ: 'イ',
  ゥ: 'ウ',
  ェ: 'エ',
  ォ: 'オ',
  ッ: 'ツ',
  ャ: 'ヤ',
  ュ: 'ユ',
  ョ: 'ヨ',
  ヮ: 'ワ',
  ヵ: 'カ',
  ヶ: 'ケ',
}
const smallKanaRegex = new RegExp(`[${Object.keys(SMALL_TO_LARGE_KANA).join('')}]`, 'g')

/**
 * IME変換中の検索語から、末尾の未確定な全角英字を1文字外す。
 * ローマ字入力の途中（`かもｎ` など）を、確定済みの文字までで検索するために使う。
 *
 * @param value 変換中の入力文字列
 * @returns 末尾が全角英字ならそれを除いた文字列。それ以外はそのまま
 */
export function removeTrailingFullwidthAlphabet(value: string): string {
  return trailingFullwidthAlphabetRegex.test(value) ? value.slice(0, -1) : value
}

/**
 * IMEの変換状態に応じて、検索へ渡す文字列を決める。
 * 変換中だけ末尾の全角英字を外し、確定済みの全角英字は残す。
 *
 * @param value 入力欄に表示している文字列
 * @param composing IME変換中なら true
 * @returns 検索条件に使う文字列
 */
export function resolveComposingSearchQuery(value: string, composing: boolean): string {
  return composing ? removeTrailingFullwidthAlphabet(value) : value
}

/**
 * 検索クエリを曲名検索用と読み検索用に正規化する。
 * 確定済みの全角英字は削除しない。IME変換中の末尾全角英字は、この関数の前に
 * `resolveComposingSearchQuery` で検索条件から外す。
 *
 * @param query 入力された検索文字列。未設定の場合は空文字として扱う。
 * @returns 曲名検索用と読み検索用に正規化したクエリ。
 */
export function normalizeQuery(query: string | null | undefined): {
  normalizedQuery: string
  normalizedReadingQuery: string
} {
  return {
    normalizedQuery: normalizeForSearch(query),
    normalizedReadingQuery: normalizeForReadingSearch(query),
  }
}

/**
 * 検索用に文字列を正規化する。
 * - Unicode正規化（NFKC）
 * - 大文字を小文字に変換
 * - カタカナをひらがなに変換
 * - 記号・空白類を除去
 */
export function normalizeForSearch(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(symbolOrSpaceRegex, '')
}

/**
 * 読み検索用に文字列を正規化する。
 * 楽曲マスタの読みは大きいカナで登録されているため、クエリ側もそれに合わせる。
 * - Unicode正規化（NFKC → NFD）
 * - 濁点・半濁点を除去
 * - 長音記号をウに変換
 * - 小書きのカナを大きいカナに変換
 * - 最後に normalizeForSearch を適用
 *
 * @param value 正規化する文字列
 * @returns 読み検索用に正規化した文字列。未設定の場合は空文字
 */
export function normalizeForReadingSearch(value: string | null | undefined): string {
  if (!value) return ''
  return normalizeForSearch(
    value
      .normalize('NFKC')
      .normalize('NFD')
      .replace(voicedMarkRegex, '')
      .replace(prolongedSoundMarkRegex, 'ウ')
      .replace(smallKanaRegex, (ch) => SMALL_TO_LARGE_KANA[ch])
  )
}

export function matchesNormalizedSearchQuery(
  normalizedTitle: string,
  normalizedArtist: string,
  normalizedReading: string,
  normalizedQuery: string,
  normalizedReadingQuery: string
): boolean {
  if (!normalizedQuery) return true
  return (
    normalizedTitle.includes(normalizedQuery) ||
    normalizedArtist.includes(normalizedQuery) ||
    normalizedReading.includes(normalizedReadingQuery)
  )
}

/**
 * 曲名・アーティスト名・読みが検索クエリに部分一致するか判定する。
 *
 * @param title - 曲名。
 * @param artist - アーティスト名。
 * @param query - 検索文字列。
 * @param reading - 楽曲の読み。未設定または空欄の場合は曲名を使う。
 * @returns いずれかの検索対象が一致する場合はtrue。
 */
export function matchesSearchQuery(
  title: string,
  artist: string,
  query: string,
  reading?: string | null
): boolean {
  const { normalizedQuery, normalizedReadingQuery } = normalizeQuery(query)
  const normalizedTitle = normalizeForSearch(title)
  const normalizedArtist = normalizeForSearch(artist)
  const normalizedReading = normalizeForReadingSearch(normalizeSongReading({ title, reading }))
  return matchesNormalizedSearchQuery(
    normalizedTitle,
    normalizedArtist,
    normalizedReading,
    normalizedQuery,
    normalizedReadingQuery
  )
}
