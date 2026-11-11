/**
 * 自前配信する SIL OFL 1.1 フォントのライセンス文。
 *
 * 各 `OFL.txt` は google/fonts の該当ファミリーのライセンス文を、改行を LF に揃えて置いている。
 * Jost の google/fonts 側 OFL.txt は著作権 URL が `https://github.com/indestructible-type` で
 * 切れている。フォントの METADATA.pb と上流リポジトリ indestructible-type/Jost の表示は
 * `https://github.com/indestructible-type/Jost` なので、著作権表示だけそちらに合わせる。
 * Noto Sans JP の著作権表示と Reserved Font Name は google/fonts の OFL.txt のまま。
 */

/** ライセンス文に必ず含まれる、OFL 1.1 本文の見出し。 */
export const SIL_OFL_HEADING = 'SIL OPEN FONT LICENSE'

/** OFL 1.1 本文の版表示。 */
export const SIL_OFL_VERSION_LINE = 'Version 1.1 - 26 February 2007'

/**
 * 配信ディレクトリと、その OFL.txt 先頭の著作権表示。
 *
 * @property id - `/static/fonts/` 直下のディレクトリ名。
 * @property copyright - OFL.txt の1行目。
 */
export type SelfHostedFontLicense = {
  id: string
  copyright: string
}

/** ビルドが woff2 と一緒に配信するライセンス文。 */
export const SELF_HOSTED_FONT_LICENSES: readonly SelfHostedFontLicense[] = [
  {
    id: 'jost',
    copyright:
      'Copyright 2020 The Jost Project Authors (https://github.com/indestructible-type/Jost)',
  },
  {
    id: 'noto-sans',
    copyright:
      'Copyright 2022 The Noto Project Authors (https://github.com/notofonts/latin-greek-cyrillic)',
  },
  {
    id: 'noto-sans-jp',
    copyright:
      "Copyright 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'",
  },
  {
    id: 'oswald',
    copyright:
      'Copyright 2016 The Oswald Project Authors (https://github.com/googlefonts/OswaldFont)',
  },
]

/**
 * フォントの OFL.txt を配信するパスを返す。
 *
 * @param id - {@link SELF_HOSTED_FONT_LICENSES} の id。
 * @returns `/static/fonts/<id>/OFL.txt`。
 */
export const selfHostedFontLicensePublicPath = (id: string): string => {
  if (!SELF_HOSTED_FONT_LICENSES.some((license) => license.id === id)) {
    throw new Error(`フォントライセンスの id が不正です: ${id}`)
  }
  return `/static/fonts/${id}/OFL.txt`
}
