export type SongChartDisplayMode = 'const' | 'notes'

export const SONG_CHART_DISPLAY_LABELS = {
  const: '譜面定数',
  notes: 'ノーツ数',
  toggle: 'ノーツ数表示',
  toNotes: 'ノーツ数に切り替え',
  toConst: '譜面定数に切り替え',
} as const

/** ノーツ数が未設定のときに表示するプレースホルダ */
export const SONG_CHART_NOTES_EMPTY = '-'
