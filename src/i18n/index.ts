import { type Flatten, flatten, resolveTemplate, translator } from '@solid-primitives/i18n'
import type { AppLocale } from '../utils/localePreference'
import ja from './locales/ja.json' with { type: 'json' }

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

/** 日本語以外の辞書の読み込み処理。表示中の言語の辞書だけを取得するため動的に読み込む。 */
const DICTIONARY_LOADERS: Record<
  Exclude<AppLocale, 'ja'>,
  () => Promise<{ default: Readonly<Record<string, unknown>> }>
> = {
  en: () => import('./locales/en.json', { with: { type: 'json' } }),
  'zh-TW': () => import('./locales/zh-TW.json', { with: { type: 'json' } }),
  ko: () => import('./locales/ko.json', { with: { type: 'json' } }),
}

/** 現在の表示言語の平坦化済み辞書。未翻訳の文言は日本語で補完する。 */
let activeDictionary: FlatDictionary = FLAT_JA

/**
 * 表示言語の辞書を読み込み、以降の文言参照に使用する。
 * 表示言語の切り替えは再読み込みで反映するため、アプリ描画前に一度だけ呼び出す。
 * 読み込みに失敗した場合は日本語の辞書を使用する。
 * @param locale 読み込む表示言語
 * @returns 読み込み完了時に解決される Promise
 */
export const loadLocaleDictionary = async (locale: AppLocale): Promise<void> => {
  if (locale === 'ja') {
    activeDictionary = FLAT_JA
    return
  }

  try {
    const dictionary = await DICTIONARY_LOADERS[locale]()
    activeDictionary = { ...FLAT_JA, ...flatten(dictionary.default) }
  } catch {
    activeDictionary = FLAT_JA
  }
}

/**
 * 現在の表示言語で平坦化済み辞書を取得する。
 * @returns 現在の表示言語の辞書
 */
const currentDictionary = (): FlatDictionary => activeDictionary

/**
 * 辞書パスから現在の表示言語の文言を取得する。
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
 * 返り値のプロパティは参照するたびに現在の表示言語の文言を返す。
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
 * 選択肢の表示文言を辞書の文言で参照するように置き換える。
 * 置き換えたプロパティは参照するたびに現在の表示言語の文言を返す。
 *
 * @example
 * const OPTIONS = withLocalizedLabels([{ value: 'HRD' }, { value: 'BRV' }] as const, COPY.lamps)
 *
 * @param options 表示文言以外の選択肢情報
 * @param labels 選択肢の識別値をキーにした文言辞書
 * @param field 文言を設定するプロパティ名。既定値は label
 * @param keyField 選択肢の識別値を持つプロパティ名。既定値は value
 * @returns 表示文言を持つ選択肢の配列
 */
export const withLocalizedLabels = <
  T extends object,
  F extends string = 'label',
  K extends keyof T = 'value' extends keyof T ? 'value' : keyof T,
>(
  options: readonly T[],
  labels: Readonly<Record<string, string>>,
  field: F = 'label' as F,
  keyField: K = 'value' as K
): (T & { readonly [P in F]: string })[] =>
  options.map((option) =>
    Object.defineProperty(
      Object.defineProperties({}, Object.getOwnPropertyDescriptors(option)),
      field,
      {
        enumerable: true,
        get: () => labels[String(option[keyField])],
      }
    )
  ) as (T & { readonly [P in F]: string })[]
