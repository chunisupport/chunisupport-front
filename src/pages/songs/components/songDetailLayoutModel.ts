export type SongDetailViewState = 'content' | 'loading' | 'error'

export const getSongDetailViewState = (
  songExists: boolean,
  isSongLoading: boolean
): SongDetailViewState => {
  if (songExists) return 'content'
  return isSongLoading ? 'loading' : 'error'
}
