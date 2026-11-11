/**
 * プロフィールコメントの入力値から、API が拒否する改行を取り除く。
 * コメントは1行のみのため、貼り付けなどで混入した改行をその場で除去する。
 *
 * @param value - 入力欄の値。
 * @returns 改行と Unicode の行区切り・段落区切りを除いた文字列。
 */
export const removeUserCommentLineBreaks = (value: string): string =>
  value.replace(/[\r\n\u2028\u2029]/g, '')

/**
 * プロフィールコメントの文字数を API と同じ基準で数える。
 *
 * @param value - 入力欄の値。
 * @returns 前後の空白を除いた Unicode コードポイント数。
 */
export const countUserCommentLength = (value: string): number => [...value.trim()].length
