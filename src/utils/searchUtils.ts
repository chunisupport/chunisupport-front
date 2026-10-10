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
 * 検索クエリ末尾の全角英字を1文字除去する。
 */
export function removeTrailingFullwidthAlphabet(value: string | null | undefined): string {
  if (!value) return ''
  return trailingFullwidthAlphabetRegex.test(value) ? value.slice(0, -1) : value
}

export function normalizeQuery(query: string | null | undefined): {
  normalizedQuery: string
  normalizedReadingQuery: string
} {
  const stabilizedQuery = removeTrailingFullwidthAlphabet(query)
  return {
    normalizedQuery: normalizeForSearch(stabilizedQuery),
    normalizedReadingQuery: normalizeForReadingSearch(stabilizedQuery),
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
 * タイトルとアーティスト名のどちらかが検索クエリに部分一致するか判定する。
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
  const normalizedReading = normalizeForReadingSearch(reading ?? title)
  return matchesNormalizedSearchQuery(
    normalizedTitle,
    normalizedArtist,
    normalizedReading,
    normalizedQuery,
    normalizedReadingQuery
  )
}
