import type { LockedSongsPlayStatus } from '../constants'

/**
 * 未解禁楽曲設定のプレイ状況フィルターに候補が一致するか判定する。
 *
 * @param playStatus - 選択されたプレイ状況。
 * @param isUnplayed - 候補が未プレイとして扱われるか。
 * @returns 候補を表示する場合はtrue。
 */
export const matchesLockedSongsPlayStatus = (
  playStatus: LockedSongsPlayStatus,
  isUnplayed: boolean
): boolean => {
  return playStatus === 'unplayed' ? isUnplayed : !isUnplayed
}
