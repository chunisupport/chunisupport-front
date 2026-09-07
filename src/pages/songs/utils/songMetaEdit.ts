import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../../constants/difficulty'
import type {
  PlayerDataDifficulty,
  SongDTO,
  UpdateChartRequestDTO,
  UpdateSongRequestDTO,
  UpdateWorldsendChartRequestDTO,
  UpdateWorldsendSongRequestDTO,
  WorldsendSongDTO,
} from '../../../types/api'
import { formatChartConst } from '../../../utils/chartConstFormat'
import { toInputValue } from '../../../utils/rangeInput'
import { SONG_EDIT_COPY, SONG_EDIT_INPUT_LIMITS } from '../songEditConstants'

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const NON_NEGATIVE_INTEGER_PATTERN = /^\d*$/

export type SongMetaEditValues = {
  genre: string | null
  bpm: number | null
  releasedAt: string | null
}

export type SongMetaEditFormInput = {
  genreName: string | null
  bpm: string
  releasedAt: string
}

export type ChartMetaEditDraft = {
  difficulty: PlayerDataDifficulty
  const: string
  is_const_unknown: boolean
  notes: string
  notes_designer: string
}

export type WorldsendChartMetaEditFormInput = {
  attribute: string
  levelStar: string
  notes: string
  notesDesigner: string
}

export type SongMetaEditParseResult<T> =
  | {
      ok: true
      value: T
    }
  | {
      ok: false
      message: string
    }

/**
 * BASIC / ADVANCED は NOTES DESIGNER が存在しないため、入力対象外とする。
 *
 * @param difficulty - 判定対象の難易度名。
 * @returns NOTES DESIGNER を入力できる場合は true。
 */
export const hasNotesDesigner = (difficulty: PlayerDataDifficulty): boolean =>
  difficulty !== 'BASIC' && difficulty !== 'ADVANCED'

/**
 * 空文字を null に正規化したトリム済み文字列を返す。
 *
 * @param value - 正規化する文字列。
 * @returns 空白のみの場合は null、それ以外はトリム済み文字列。
 */
export const toNullableTrimmedString = (value: string | null | undefined): string | null =>
  value?.trim() ? value.trim() : null

/**
 * 日付入力を YYYY-MM-DD へ正規化する。
 *
 * @param value - 入力された日付文字列。
 * @returns 正規化できた場合は日付、空または不正な場合は null。
 */
export const toDateOnly = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return trimmed
  }

  const datePrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (datePrefixMatch && DATE_ONLY_PATTERN.test(datePrefixMatch[1])) {
    return datePrefixMatch[1]
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

/**
 * 日付入力欄へ渡す YYYY-MM-DD 文字列を返す。
 *
 * @param value - 楽曲のリリース日。
 * @returns 入力欄用の日付文字列。未設定時は空文字。
 */
export const toDateInputValue = (value: string | null | undefined): string =>
  toDateOnly(value) ?? ''

/**
 * 非負整数の入力途中文字列だけを残す。
 *
 * @param value - 入力欄から受け取った文字列。
 * @returns 許可する入力。不正な文字列の場合は null。
 */
export const normalizeNonNegativeIntegerInput = (value: string): string | null =>
  NON_NEGATIVE_INTEGER_PATTERN.test(value) ? value : null

/**
 * 空欄を許す非負整数入力を数値へ変換する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @returns 空欄は null、不正値は invalid、それ以外は整数。
 */
export const parseOptionalNonNegativeInteger = (value: string): number | null | 'invalid' => {
  const trimmed = value.trim()
  if (trimmed === '') return null
  if (!/^\d+$/.test(trimmed)) return 'invalid'

  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed) || parsed < 0) return 'invalid'
  return parsed
}

/**
 * 楽曲情報編集フォームの入力を更新リクエスト用の値へ正規化する。
 *
 * @param input - ジャンル、BPM、リリース日の入力値。
 * @param requireGenre - ジャンル選択を必須にするか。
 * @returns 正規化済みの値、またはエラーメッセージ。
 */
export const parseSongMetaEditValues = (
  input: SongMetaEditFormInput,
  requireGenre: boolean
): SongMetaEditParseResult<SongMetaEditValues> => {
  if (requireGenre && !input.genreName) {
    return { ok: false, message: SONG_EDIT_COPY.genreRequired }
  }

  const bpm = parseOptionalNonNegativeInteger(input.bpm)
  if (bpm === 'invalid') {
    return { ok: false, message: SONG_EDIT_COPY.bpmInvalid }
  }

  const releasedAt = toDateOnly(input.releasedAt)
  if (input.releasedAt.trim() && !releasedAt) {
    return { ok: false, message: SONG_EDIT_COPY.releaseInvalid }
  }

  return {
    ok: true,
    value: {
      genre: input.genreName,
      bpm,
      releasedAt,
    },
  }
}

/**
 * 通常楽曲の楽曲情報だけを更新する PUT リクエストを組み立てる。
 *
 * @param song - 表示中の通常楽曲。
 * @param values - 編集後のジャンル、BPM、リリース日。
 * @returns 譜面を変更しない通常楽曲更新リクエスト。
 */
export const buildSongMetaUpdateRequest = (
  song: SongDTO,
  values: SongMetaEditValues
): UpdateSongRequestDTO => ({
  id: song.id,
  title: song.title,
  reading: song.reading,
  artist: song.artist,
  genre: values.genre,
  bpm: values.bpm,
  released_at: values.releasedAt,
  jacket: song.jacket,
  is_new: song.is_new,
  charts: {},
})

/**
 * WORLD'S END 楽曲の楽曲情報だけを更新する PUT リクエストを組み立てる。
 *
 * @param song - 表示中の WORLD'S END 楽曲。
 * @param values - 編集後のジャンル、BPM、リリース日。
 * @returns 譜面を変更しない WORLD'S END 楽曲更新リクエスト。
 */
export const buildWorldsendSongMetaUpdateRequest = (
  song: WorldsendSongDTO,
  values: SongMetaEditValues
): UpdateWorldsendSongRequestDTO => ({
  id: song.id,
  title: song.title,
  reading: song.reading,
  artist: song.artist,
  genre: values.genre,
  bpm: values.bpm,
  released_at: values.releasedAt,
  jacket: song.jacket,
})

/**
 * 表示中の通常楽曲から譜面編集ドラフトを作成する。
 *
 * @param song - 表示中の通常楽曲。
 * @returns 存在する譜面だけの編集ドラフト。
 */
export const buildChartDraftsFromSong = (song: SongDTO): ChartMetaEditDraft[] =>
  PLAYER_DATA_DIFFICULTIES.flatMap((difficulty) => {
    const chart = song.charts[difficulty]
    if (!chart) return []

    return [
      {
        difficulty,
        const: formatChartConst(chart.const),
        is_const_unknown: chart.is_const_unknown,
        notes: toInputValue(chart.notes),
        notes_designer: chart.notes_designer ?? '',
      },
    ]
  })

/**
 * 譜面編集ドラフトを更新リクエストの譜面マップへ正規化する。
 *
 * @param drafts - 編集中の譜面ドラフト。
 * @returns 正規化済みの譜面マップ、またはエラーメッセージ。
 */
export const parseChartMetaDrafts = (
  drafts: readonly ChartMetaEditDraft[]
): SongMetaEditParseResult<Record<string, UpdateChartRequestDTO>> => {
  const charts: Record<string, UpdateChartRequestDTO> = {}

  for (const draft of drafts) {
    const chartConst = Number(draft.const)
    if (draft.const.trim() === '' || !Number.isFinite(chartConst) || chartConst < 0) {
      return { ok: false, message: SONG_EDIT_COPY.constInvalid }
    }

    const notes = parseOptionalNonNegativeInteger(draft.notes)
    if (notes === 'invalid') {
      return { ok: false, message: SONG_EDIT_COPY.notesInvalid }
    }

    if (draft.notes_designer.length > SONG_EDIT_INPUT_LIMITS.notesDesigner) {
      return { ok: false, message: SONG_EDIT_COPY.notesDesignerTooLong }
    }

    charts[draft.difficulty] = {
      const: chartConst,
      is_const_unknown: draft.is_const_unknown,
      notes,
      notes_designer: toNullableTrimmedString(draft.notes_designer),
    }
  }

  return { ok: true, value: charts }
}

/**
 * 通常楽曲の譜面情報だけを更新する PUT リクエストを組み立てる。
 *
 * @param song - 表示中の通常楽曲。
 * @param charts - 編集後の譜面マップ。
 * @returns 楽曲情報を現行値のまま維持する通常楽曲更新リクエスト。
 */
export const buildChartMetaUpdateRequest = (
  song: SongDTO,
  charts: Record<string, UpdateChartRequestDTO>
): UpdateSongRequestDTO => ({
  id: song.id,
  title: song.title,
  reading: song.reading,
  artist: song.artist,
  genre: song.genre,
  bpm: song.bpm,
  released_at: toDateOnly(song.release),
  jacket: song.jacket,
  is_new: song.is_new,
  charts,
})

/**
 * WORLD'S END 譜面編集フォームの入力を更新リクエスト用の値へ正規化する。
 *
 * @param input - 属性、レベル、ノーツ数、ノーツデザイナーの入力値。
 * @returns 正規化済みの譜面更新値、またはエラーメッセージ。
 */
export const parseWorldsendChartMetaEditValues = (
  input: WorldsendChartMetaEditFormInput
): SongMetaEditParseResult<UpdateWorldsendChartRequestDTO> => {
  const notes = parseOptionalNonNegativeInteger(input.notes)
  if (notes === 'invalid') {
    return { ok: false, message: SONG_EDIT_COPY.notesInvalid }
  }

  if (input.notesDesigner.length > SONG_EDIT_INPUT_LIMITS.notesDesigner) {
    return { ok: false, message: SONG_EDIT_COPY.notesDesignerTooLong }
  }

  const trimmedLevel = input.levelStar.trim()
  let levelStar: number | null = null
  if (trimmedLevel !== '') {
    const parsedLevel = Number(trimmedLevel)
    if (
      !Number.isInteger(parsedLevel) ||
      parsedLevel < WORLDSEND_LEVEL_STAR_MIN ||
      parsedLevel > WORLDSEND_LEVEL_STAR_MAX
    ) {
      return { ok: false, message: SONG_EDIT_COPY.levelInvalid }
    }
    levelStar = parsedLevel
  }

  return {
    ok: true,
    value: {
      attribute: toNullableTrimmedString(input.attribute),
      level_star: levelStar,
      notes,
      notes_designer: toNullableTrimmedString(input.notesDesigner),
    },
  }
}

/**
 * WORLD'S END 楽曲の譜面情報だけを更新する PUT リクエストを組み立てる。
 *
 * @param song - 表示中の WORLD'S END 楽曲。
 * @param chart - 編集後の WORLD'S END 譜面。
 * @returns 楽曲情報を現行値のまま維持する WORLD'S END 楽曲更新リクエスト。
 */
export const buildWorldsendChartMetaUpdateRequest = (
  song: WorldsendSongDTO,
  chart: UpdateWorldsendChartRequestDTO
): UpdateWorldsendSongRequestDTO => ({
  id: song.id,
  title: song.title,
  reading: song.reading,
  artist: song.artist,
  genre: song.genre,
  bpm: song.bpm,
  released_at: toDateOnly(song.release),
  jacket: song.jacket,
  charts: {
    WORLDSEND: chart,
  },
})
