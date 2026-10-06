import { normalizeSongReading, type SongReadingSource } from './songReading'

/** 名前順フォルダの内部キー。配列の順番がフォルダの表示順 */
export const NAME_FOLDER_KEYS = [
  'ABCD',
  'EFGH',
  'IJKL',
  'MNOP',
  'QRST',
  'UVWXYZ',
  'A',
  'KA',
  'SA',
  'TA',
  'NA',
  'HA',
  'MA',
  'YA',
  'RA',
  'WA',
  'NUMBER',
] as const

/** 名前順フォルダの内部キー */
export type NameFolderKey = (typeof NAME_FOLDER_KEYS)[number]

/** 英字フォルダと所属する文字。キー自体が所属する英字を表す */
const ALPHABET_FOLDERS = [
  'ABCD',
  'EFGH',
  'IJKL',
  'MNOP',
  'QRST',
  'UVWXYZ',
] as const satisfies readonly NameFolderKey[]

/** カナ行のフォルダと所属するカタカナ */
const KANA_ROWS: ReadonlyArray<readonly [NameFolderKey, string]> = [
  ['A', 'アイウエオ'],
  ['KA', 'カキクケコ'],
  ['SA', 'サシスセソ'],
  ['TA', 'タチツテト'],
  ['NA', 'ナニヌネノ'],
  ['HA', 'ハヒフヘホ'],
  ['MA', 'マミムメモ'],
  ['YA', 'ヤユヨ'],
  ['RA', 'ラリルレロ'],
  ['WA', 'ワヰヱヲン'],
]

/**
 * 楽曲の読みから名前順フォルダを判定する。
 *
 * 読みは大きいカタカナ・英大文字・数字に正規化済みのため、先頭1文字をそのまま判定に使う。
 * 読みが未設定または空欄の場合は曲名で判定する。英字・カナに当たらないもの（数字始まり）は NUMBER とする。
 *
 * @param song - 対象の楽曲。
 * @returns 所属する名前順フォルダのキー。
 */
export const resolveNameFolder = (song: SongReadingSource): NameFolderKey => {
  const [first = ''] = normalizeSongReading(song)
  if (first === '') return 'NUMBER'
  return (
    ALPHABET_FOLDERS.find((folder) => folder.includes(first)) ??
    KANA_ROWS.find(([, chars]) => chars.includes(first))?.[0] ??
    'NUMBER'
  )
}
