import { localizedCopy } from '../../../i18n'
export type SongChartDisplayMode = 'const' | 'notes'

export const SONG_CHART_DISPLAY_LABELS = localizedCopy('songs.chartDisplay')

/** ノーツ数が未設定のときに表示するプレースホルダ */
export const SONG_CHART_NOTES_EMPTY = '-'
