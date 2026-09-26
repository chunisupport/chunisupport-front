import assert from 'node:assert/strict'
import test from 'node:test'
import en from './locales/en.json' with { type: 'json' }
import ja from './locales/ja.json' with { type: 'json' }
import ko from './locales/ko.json' with { type: 'json' }
import zhTW from './locales/zh-TW.json' with { type: 'json' }

type Dictionary = { readonly [key: string]: unknown }

/**
 * 辞書をドット区切りのパスと文言の組へ平坦化する。
 * @param dictionary 平坦化する辞書
 * @param prefix 親のパス
 * @returns パスと文言の組
 */
const flattenEntries = (dictionary: Dictionary, prefix = ''): [string, string][] =>
  Object.entries(dictionary).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flattenEntries(value as Dictionary, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(value)]]
  )

/**
 * 文言に含まれるテンプレート変数名を抽出する。
 * @param message 文言
 * @returns 並べ替え済みのテンプレート変数名
 */
const extractPlaceholders = (message: string): string[] =>
  [...message.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).sort()

const JA_ENTRIES = new Map(flattenEntries(ja))

for (const [locale, dictionary] of Object.entries({ en, 'zh-TW': zhTW, ko })) {
  test(`${locale} の辞書が日本語辞書と同じキーを持つこと`, () => {
    // Given
    const entries = new Map(flattenEntries(dictionary))

    // When
    const missing = [...JA_ENTRIES.keys()].filter((key) => !entries.has(key))
    const extra = [...entries.keys()].filter((key) => !JA_ENTRIES.has(key))

    // Then
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] })
  })

  test(`${locale} の文言が日本語と同じテンプレート変数を持つこと`, () => {
    // Given
    const entries = flattenEntries(dictionary)

    // When
    const mismatches = entries.filter(
      ([key, message]) =>
        extractPlaceholders(message).join() !==
        extractPlaceholders(JA_ENTRIES.get(key) ?? '').join()
    )

    // Then
    assert.deepEqual(mismatches, [])
  })
}
