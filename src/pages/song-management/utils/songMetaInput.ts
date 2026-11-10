import { toDateInputValue } from '../../../utils/dateOnly'
import { toOptionalNumberInput, toOptionalTextInput } from './songDraftCommon'

/**
 * 読み・Wikiページタイトル・配信日・ジャケットの入力をドラフト値へ変換する。
 * 空白のみは null。それ以外は入力途中の前後空白を保持する。
 *
 * 配信日もここでは日付へ丸めない。`type="date"` の入力文字列をそのまま渡し、
 * 送信時の日付正規化は各ドラフトのリクエスト組み立てに任せる。
 *
 * @param value 入力欄の文字列
 * @returns 空白のみなら null、それ以外は入力値
 */
export const toSongMetaOptionalTextDraftValue = (value: string): string | null =>
  toOptionalTextInput(value)

/**
 * 任意テキストのドラフト値を入力欄の表示値へ変換する。
 *
 * @param value ドラフトの文字列。未設定は null
 * @returns 入力欄へ渡す文字列。未設定なら空文字
 */
export const toSongMetaOptionalTextInputValue = (value: string | null): string => value ?? ''

/**
 * BPM入力をドラフト値へ変換する。
 *
 * @param value 入力欄の文字列
 * @returns 空文字なら null、それ以外は Number 変換した値
 */
export const toSongMetaBpmDraftValue = (value: string): number | null =>
  toOptionalNumberInput(value)

/**
 * BPMのドラフト値を入力欄の表示値へ変換する。
 * 0 は未入力と区別し、そのまま表示する。
 *
 * @param value ドラフトの BPM。未入力は null
 * @returns 入力欄へ渡す数値。未入力なら空文字
 */
export const toSongMetaBpmInputValue = (value: number | null): number | '' => value ?? ''

/**
 * 配信日のドラフト値を date 入力欄の表示値へ変換する。
 *
 * @param value ドラフトの配信日。未入力は null
 * @returns `YYYY-MM-DD`。未設定または日付として扱えない値は空文字
 */
export const toSongMetaReleasedAtInputValue = (value: string | null): string =>
  toDateInputValue(value)
