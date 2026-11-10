import { JST_TIME_ZONE } from '../../../constants/dateTime'
import type { MasterItemDTO, PlayerDataDifficulty, SongDTO } from '../../../types/api'

/** 楽曲管理画面で編集できる通常譜面の難易度名 */
export type EditableDifficultyName = PlayerDataDifficulty

/**
 * ドラフトから API リクエストを組み立てた結果。
 * 検証エラー時は画面へ表示する文言を返す。
 */
export type DraftRequestResult<T> = { ok: true; request: T } | { ok: false; message: string }

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: JST_TIME_ZONE,
})

/**
 * 更新日時を日本時間の表示文字列へ整形する。
 *
 * @param value ISO 形式などの日時文字列
 * @returns 表示用の日時。未設定または不正な値なら `-`
 */
export const formatUpdatedAt = (value: string | null | undefined): string => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return dateTimeFormatter.format(date)
}

/**
 * BASIC / ADVANCED は NOTES DESIGNER が存在しないため、入力対象外とする。
 *
 * @param difficultyName 判定対象の難易度名
 * @returns NOTES DESIGNER を入力できる場合は true
 */
export const hasNotesDesigner = (difficultyName: EditableDifficultyName): boolean => {
  return difficultyName !== 'BASIC' && difficultyName !== 'ADVANCED'
}

/**
 * 文字列の前後空白を除き、空文字を未設定として扱う。
 *
 * @param value 正規化対象の文字列
 * @returns 前後空白を除いた値。空または未設定なら null
 */
export const toNullableTrimmedString = (value: string | null): string | null => {
  return value?.trim() ? value.trim() : null
}

/**
 * 入力欄の値を、空白のみなら null として扱う任意文字列へ変換する。
 * 入力途中の前後空白は保持する。
 *
 * @param value 入力欄の値
 * @returns 空白のみなら null、それ以外は入力値そのもの
 */
export const toOptionalTextInput = (value: string): string | null => {
  return value.trim() === '' ? null : value
}

/**
 * 数値入力欄の値を、空なら null として扱う数値へ変換する。
 *
 * @param value 入力欄の値
 * @returns 空文字なら null、それ以外は Number 変換した値
 */
export const toOptionalNumberInput = (value: string): number | null => {
  return value === '' ? null : Number(value)
}

/**
 * 楽曲DTOの新曲フラグを編集用の真偽値へ正規化する。
 *
 * @param song 新曲フラグを持つ楽曲DTO
 * @returns APIレスポンスの is_new が true の場合のみ true
 */
export const readSongNewFlag = (song: Pick<SongDTO, 'is_new'>): boolean => {
  return song.is_new === true
}

/**
 * ジャンル名からジャンルマスタIDを引く。
 *
 * @param genres ジャンルマスタ
 * @param genreName ジャンル名
 * @returns 一致するジャンルID。見つからない場合は null
 */
export const findGenreIdByName = (
  genres: readonly MasterItemDTO[],
  genreName: string | null | undefined
): number | null => {
  return genres.find((genre) => genre.name === genreName)?.id ?? null
}

/**
 * ジャンルマスタIDからジャンル名を引く。
 *
 * @param genres ジャンルマスタ
 * @param genreId ジャンルID
 * @returns 一致するジャンル名。見つからない場合は null
 */
export const findGenreNameById = (
  genres: readonly MasterItemDTO[],
  genreId: number | null
): string | null => {
  return genres.find((genre) => genre.id === genreId)?.name ?? null
}
