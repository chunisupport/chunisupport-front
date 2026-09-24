import { YOUTUBE_SEARCH_URL, YOUTUBE_SONG_SEARCH_PREFIX } from '../constants/externalLink'

/**
 * 楽曲名からYouTube検索結果ページのURLを組み立てる。
 *
 * 曲名がハイフンで始まる場合などにマイナス検索として解釈されないよう、曲名はダブルクォーテーションで囲む。
 *
 * @param songTitle - 検索する楽曲名。
 * @returns YouTube検索結果ページURL。
 */
export const buildSongYoutubeSearchUrl = (songTitle: string): string => {
  const url = new URL(YOUTUBE_SEARCH_URL)
  url.searchParams.set('search_query', `${YOUTUBE_SONG_SEARCH_PREFIX} "${songTitle.trim()}"`)
  return url.toString()
}
