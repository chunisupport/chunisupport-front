import { WORLDSEND_SONG_CARD_EMPTY, WORLDSEND_SONG_CARD_STAR } from '../constants'

/**
 * WORLD'S END の星数をカード表示用の繰り返し星へ変換する。
 *
 * @param levelStar - 星数。未設定は null。
 * @returns `★★★★★` 形式の文字列。未設定はプレースホルダ。
 */
export const formatWorldsendSongCardStars = (levelStar: number | null | undefined): string => {
  if (levelStar == null || levelStar <= 0) return WORLDSEND_SONG_CARD_EMPTY
  return WORLDSEND_SONG_CARD_STAR.repeat(levelStar)
}

/**
 * 属性と星数をカード下部上段の1行へ整形する。
 *
 * @param attribute - 譜面属性。未設定は null。
 * @param levelStar - 星数。未設定は null。
 * @returns `狂 ★★★★★` 形式の文字列。
 */
export const formatWorldsendSongCardLevelLine = (
  attribute: string | null | undefined,
  levelStar: number | null | undefined
): string => {
  const attributeText = attribute ? attribute : WORLDSEND_SONG_CARD_EMPTY
  return `${attributeText} ${formatWorldsendSongCardStars(levelStar)}`
}

/**
 * 譜面のノーツ数をカード表示用の文字列に変換する。
 *
 * @param notes - ノーツ数。未設定は null。
 * @returns 表示文字列。未設定はプレースホルダ。
 */
export const formatWorldsendSongCardNotes = (notes: number | null | undefined): string =>
  notes == null ? WORLDSEND_SONG_CARD_EMPTY : String(notes)
