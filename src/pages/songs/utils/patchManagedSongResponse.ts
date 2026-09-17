type ManagedSongListResponse<T> = { songs: T[] }

/**
 * 管理楽曲一覧の指定IDだけを更新する。
 * 他の要素の参照は維持し、一覧全体の再生成による再描画を避ける。
 *
 * @param current - 現在の resource 値
 * @param songId - 差し替え対象の楽曲ID
 * @param updater - 対象楽曲を更新する関数
 * @returns 対象だけを更新した一覧。current が無い場合は undefined
 */
export const patchManagedSongResponse = <T extends { id: string }>(
  current: ManagedSongListResponse<T> | undefined,
  songId: string,
  updater: (song: T) => T
): ManagedSongListResponse<T> | undefined => {
  if (!current) return current
  return {
    songs: current.songs.map((song) => (song.id === songId ? updater(song) : song)),
  }
}
