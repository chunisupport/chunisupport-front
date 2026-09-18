/** 画像化などでプレイヤーレベルを隠すときの表示 */
export const HIDDEN_PLAYER_LEVEL_LABEL = 'Lv. ＊＊＊'

/**
 * プレイヤーレベルの表示文字列を返す。
 *
 * @param level - プレイヤーレベル。
 * @param hidden - レベルを隠す場合は true。
 * @returns `Lv. {level}`、または非表示時は `Lv. ＊＊＊`。
 */
export const formatPlayerLevelLabel = (level: number, hidden = false): string =>
  hidden ? HIDDEN_PLAYER_LEVEL_LABEL : `Lv. ${level}`
