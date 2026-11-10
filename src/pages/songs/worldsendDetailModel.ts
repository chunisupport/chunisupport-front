import { WORLDSEND_SCORE_LABEL } from '../../constants/chart'
import type { WorldsendRecordDTO, WorldsendSongDTO } from '../../types/api'

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

/** WORLD'S END の自己スコアカードへ渡すスコアとランプ状態 */
export type WorldsendOwnScoreItem = {
  difficulty: typeof WORLDSEND_SCORE_LABEL
  score: number | undefined
  comboLamp: WorldsendRecordDTO['combo_lamp'] | undefined
  clearLamp: WorldsendRecordDTO['clear_lamp'] | undefined
  fullChain: WorldsendRecordDTO['full_chain'] | undefined
  supportsHistory: true
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

/**
 * WORLD'S END レコードを自己スコアカードの表示項目へ変換する。
 *
 * @param record - 表示対象の WORLD'S END レコード。
 * @returns スコアと3種類のランプを含む自己スコア表示項目。
 */
export const buildWorldsendOwnScoreItem = (
  record: WorldsendRecordDTO | null | undefined
): WorldsendOwnScoreItem => ({
  difficulty: WORLDSEND_SCORE_LABEL,
  score: record?.is_played ? record.score : undefined,
  comboLamp: record?.combo_lamp,
  clearLamp: record?.clear_lamp,
  fullChain: record?.full_chain,
  supportsHistory: true,
})
