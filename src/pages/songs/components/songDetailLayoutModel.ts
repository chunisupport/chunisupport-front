export type SongDetailViewState = 'content' | 'loading' | 'error'

export const getSongDetailViewState = (
  songExists: boolean,
  isSongLoading: boolean
): SongDetailViewState => {
  if (isSongLoading) return 'loading'
  return songExists ? 'content' : 'error'
}
