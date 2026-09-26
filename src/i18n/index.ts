import { type Flatten, flatten, resolveTemplate, translator } from '@solid-primitives/i18n'
import { localePreference } from '../stores/localePreferences'
import type { AppLocale } from '../utils/localePreference'
import en from './locales/en.json' with { type: 'json' }
import ja from './locales/ja.json' with { type: 'json' }
import ko from './locales/ko.json' with { type: 'json' }
import zhTW from './locales/zh-TW.json' with { type: 'json' }

/** 日本語辞書を基準にした文言辞書の型 */
export type LocaleDictionary = typeof ja

/** ドット区切りのパスで参照できる平坦化済み文言辞書の型 */
type FlatLocaleDictionary = Flatten<LocaleDictionary>

/** 文言オブジェクトとして参照できる辞書パス */
export type LocaleCopyPath = {
  [K in keyof FlatLocaleDictionary]: FlatLocaleDictionary[K] extends string ? never : K
}[keyof FlatLocaleDictionary]

/** 単一の文言として参照できる辞書パス */
export type LocaleMessagePath = {
  [K in keyof FlatLocaleDictionary]: FlatLocaleDictionary[K] extends string ? K : never
}[keyof FlatLocaleDictionary]

type FlatDictionary = Readonly<Record<string, unknown>>

const FLAT_JA: FlatDictionary = flatten(ja)

/** 言語ごとの平坦化済み辞書。未翻訳の文言は日本語で補完する。 */
const FLAT_DICTIONARIES: Record<AppLocale, FlatDictionary> = {
  ja: FLAT_JA,
  en: { ...FLAT_JA, ...flatten(en) },
  'zh-TW': { ...FLAT_JA, ...flatten(zhTW) },
  ko: { ...FLAT_JA, ...flatten(ko) },
}

/**
 * 現在の表示言語で平坦化済み辞書を取得する。
 * @returns 現在の表示言語の辞書
 */
const currentDictionary = (): FlatDictionary => FLAT_DICTIONARIES[localePreference()]

/**
 * 辞書パスから現在の表示言語の文言を取得する。
 * リアクティブな文脈で呼び出すと、表示言語の変更に追従する。
 *
 * @example t('common.save')
 * @example t('songs.resultCount', { count: 10 })
 */
export const t = translator(currentDictionary as () => FlatLocaleDictionary, resolveTemplate) as <
  K extends LocaleMessagePath,
>(
  path: K,
  args?: Record<string, string | number>
) => string

/**
 * `{{ name }}` 形式のテンプレート文字列へ値を埋め込む。
 * @param template 埋め込み先のテンプレート文字列
 * @param args 埋め込む値
 * @returns 値を埋め込んだ文字列
 */
export const formatMessage = (template: string, args: Record<string, string | number>): string =>
  resolveTemplate(template, args)

const copyCache = new Map<string, object>()

/**
 * 指定パスの辞書を参照するビューを生成する。
 * プロパティを参照するたびに現在の表示言語の文言を返す。
 * @param path 辞書パス
 * @returns 辞書パス配下を参照するビュー
 */
const createCopyView = (path: string): object => {
  const cached = copyCache.get(path)
  if (cached) {
    return cached
  }

  const view: object = new Proxy(
    {},
    {
      get: (_target, key) => {
        if (typeof key !== 'string') {
          return undefined
        }
        const childPath = `${path}.${key}`
        const value = currentDictionary()[childPath]
        return typeof value === 'object' && value !== null && !Array.isArray(value)
          ? createCopyView(childPath)
          : value
      },
      has: (_target, key) => typeof key === 'string' && `${path}.${key}` in FLAT_JA,
      ownKeys: () => Object.keys(FLAT_JA[path] as object),
      getOwnPropertyDescriptor: (_target, key): PropertyDescriptor | undefined =>
        typeof key === 'string' && `${path}.${key}` in FLAT_JA
          ? {
              configurable: true,
              enumerable: true,
              value: (view as Record<string, unknown>)[key],
            }
          : undefined,
    }
  )
  copyCache.set(path, view)
  return view
}

/**
 * 辞書パス配下の文言をオブジェクトとして参照する。
 * 返り値のプロパティは参照するたびに現在の表示言語の文言を返すため、
 * JSX やメモ内で参照すると表示言語の変更に追従する。
 *
 * @example
 * const COPY = localizedCopy('settings.appearance')
 * COPY.themeLabel // 現在の表示言語の文言
 *
 * @param path 辞書パス
 * @returns 辞書パス配下の文言オブジェクト
 */
export const localizedCopy = <P extends LocaleCopyPath>(path: P): FlatLocaleDictionary[P] =>
  createCopyView(path) as FlatLocaleDictionary[P]

/**
 * 選択肢の label を辞書の文言で参照するように置き換える。
 * label は参照するたびに現在の表示言語の文言を返す。
 *
 * @example
 * const OPTIONS = withLocalizedLabels([{ value: 'HRD' }, { value: 'BRV' }] as const, COPY.lamps)
 *
 * @param options label 以外の選択肢情報
 * @param labels 選択肢の値をキーにした文言辞書
 * @returns label を持つ選択肢の配列
 */
export const withLocalizedLabels = <T extends { readonly value: string | number }>(
  options: readonly T[],
  labels: Readonly<Record<string, string>>
): (T & { readonly label: string })[] =>
  options.map(
    (option) =>
      Object.defineProperty({ ...option }, 'label', {
        enumerable: true,
        get: () => labels[String(option.value)],
      }) as T & { readonly label: string }
  )
