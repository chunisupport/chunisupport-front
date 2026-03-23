import type { WorldsendSongDTO } from '../../types/api'

export type WorldsendSongInfoItem = {
  label: string
  value: string | number
}

export type WorldsendChartRow = {
  label: string
  attribute: string
  level: string
  notes: number | string
}

const fallbackText = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export const getWorldsendSongInfoItems = (song: WorldsendSongDTO): WorldsendSongInfoItem[] => [
  { label: 'ジャンル', value: fallbackText(song.genre) },
  { label: 'BPM', value: song.bpm ?? '-' },
  { label: 'リリース日', value: fallbackText(song.release) },
  { label: '公式ID', value: fallbackText(song.official_idx) },
]

export const getWorldsendChartRows = (song: WorldsendSongDTO): WorldsendChartRow[] => {
  const chart = song.charts.WORLDSEND

  return [
    {
      label: "WORLD'S END",
      attribute: fallbackText(chart?.attribute),
      level: chart?.level_star == null ? '-' : `★${chart.level_star}`,
      notes: chart?.notes ?? '-',
    },
  ]
}

export const getWorldsendTitleMeta = (song: WorldsendSongDTO) => ({
  title: fallbackText(song.title),
  artist: fallbackText(song.artist),
})
