import type { WorldsendSongDTO } from '../../types/api.ts'

export type WorldsendSongInfoItem = {
  label: string
  value: string | number
}

export type WorldsendChartRow = {
  label: string
  attribute: string
  level: string
  notes: number | string
  notesDesigner: string
}

const fallbackText = (value: string | null | undefined) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

export const getWorldsendSongInfoItems = (
  song: WorldsendSongDTO,
  versionName: string
): WorldsendSongInfoItem[] => [
  { label: 'GENRE', value: fallbackText(song.genre) },
  { label: 'BPM', value: song.bpm ?? '-' },
  { label: 'RELEASE', value: fallbackText(song.release) },
  { label: 'VERSION', value: fallbackText(versionName) },
]

export const getWorldsendChartRows = (song: WorldsendSongDTO): WorldsendChartRow[] => {
  const chart = song.charts.WORLDSEND

  return [
    {
      label: "WORLD'S END",
      attribute: fallbackText(chart?.attribute),
      level: chart?.level_star == null ? '-' : `★${chart.level_star}`,
      notes: chart?.notes ?? '-',
      notesDesigner: fallbackText(chart?.notes_designer),
    },
  ]
}

export const getWorldsendTitleMeta = (song: WorldsendSongDTO) => ({
  title: fallbackText(song.title),
  artist: fallbackText(song.artist),
})
