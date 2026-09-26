import {
  normalizePlayerDataDifficulty,
  PLAYER_DATA_DIFFICULTIES,
} from '../../../constants/difficulty'
import type {
  CreateSongRequestDTO,
  ManagedSongDTO,
  MasterItemDTO,
  UpdateSongRequestDTO,
} from '../../../types/api'
import { SONG_MANAGEMENT_INPUT_LIMITS, SONG_MANAGEMENT_MESSAGES } from '../constants'
import {
  type DraftRequestResult,
  type EditableDifficultyName,
  findGenreIdByName,
  findGenreNameById,
  readSongNewFlag,
  toDateOnly,
  toNullableTrimmedString,
} from './songDraftCommon'

/** 既存通常楽曲の譜面編集ドラフト */
export type EditableChartDraft = {
  difficulty_id: number
  difficulty_name: EditableDifficultyName
  const: string
  is_const_unknown: boolean
  notes: number | null
  notes_designer: string | null
  updated_at: string | null
}

/** 既存通常楽曲の譜面ドラフトで入力できる項目 */
export type EditableChartDraftField = 'const' | 'is_const_unknown' | 'notes' | 'notes_designer'

/** 既存通常楽曲の編集ドラフト */
export type SongDraft = {
  id: string
  title: string
  reading: string | null
  wiki_page_title: string | null
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  is_new: boolean
  updated_at: string
  charts: EditableChartDraft[]
}

/** 通常楽曲追加フォームの譜面ドラフト */
export type CreateSongChartDraft = {
  difficulty_name: EditableDifficultyName
  enabled: boolean
  const: string
  is_const_unknown: boolean
  notes: number | null
  notes_designer: string | null
}

/** 通常楽曲追加フォームの譜面ドラフトで入力できる項目 */
export type CreateSongChartDraftField =
  | 'enabled'
  | 'const'
  | 'is_const_unknown'
  | 'notes'
  | 'notes_designer'

/** 通常楽曲追加フォームのドラフト */
export type CreateSongDraft = {
  official_idx: string
  title: string
  reading: string | null
  wiki_page_title: string | null
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  is_new: boolean
  charts: CreateSongChartDraft[]
}

/**
 * 通常楽曲追加フォームの初期ドラフトを組み立てる。
 *
 * @returns すべての難易度を未選択にした追加用ドラフト
 */
export const buildCreateSongDraft = (): CreateSongDraft => {
  return {
    official_idx: '',
    title: '',
    reading: null,
    wiki_page_title: null,
    artist: '',
    genre_id: null,
    bpm: null,
    released_at: null,
    jacket: null,
    is_new: false,
    charts: PLAYER_DATA_DIFFICULTIES.map((difficultyName) => ({
      difficulty_name: difficultyName,
      enabled: false,
      const: '0',
      is_const_unknown: false,
      notes: null,
      notes_designer: null,
    })),
  }
}

/**
 * 未登録の通常譜面を編集ドラフトへ追加する初期値を組み立てる。
 *
 * @param difficultyId 追加する難易度マスタID
 * @param difficultyName 追加する難易度名
 * @returns 編集用の譜面ドラフト
 */
export const buildEmptyEditableChartDraft = (
  difficultyId: number,
  difficultyName: EditableDifficultyName
): EditableChartDraft => ({
  difficulty_id: difficultyId,
  difficulty_name: difficultyName,
  const: '0',
  is_const_unknown: false,
  notes: null,
  notes_designer: null,
  updated_at: null,
})

/**
 * 編集ドラフトに ULTIMA 譜面が含まれているか判定する。
 *
 * @param draft 判定対象の通常楽曲ドラフト
 * @returns ULTIMA 譜面がある場合は true
 */
export const hasUltimaChart = (draft: Pick<SongDraft, 'charts'>): boolean => {
  return draft.charts.some((chart) => chart.difficulty_name === 'ULTIMA')
}

/**
 * 編集ドラフトへ空の ULTIMA 譜面を追加する。
 * すでに ULTIMA 譜面がある場合は元のドラフトを返す。
 *
 * @param draft 追加先の通常楽曲ドラフト
 * @param ultimaDifficultyId ULTIMA の難易度マスタID
 * @returns ULTIMA 譜面を含むドラフト
 */
export const addUltimaChartToDraft = (draft: SongDraft, ultimaDifficultyId: number): SongDraft => {
  if (hasUltimaChart(draft)) return draft

  return {
    ...draft,
    charts: [...draft.charts, buildEmptyEditableChartDraft(ultimaDifficultyId, 'ULTIMA')],
  }
}

/**
 * 編集中の通常譜面に無効な数値入力が含まれているか判定する。
 *
 * @param charts 検証対象の通常譜面ドラフト配列
 * @returns 無効な譜面が1件でもあれば true
 */
export const hasInvalidEditableChart = (charts: EditableChartDraft[]): boolean => {
  return charts.some((chart) => {
    const chartConst = parseFloat(chart.const)
    return Number.isNaN(chartConst) || chartConst < 0 || (chart.notes !== null && chart.notes < 0)
  })
}

/**
 * 管理用の通常楽曲DTOを編集ドラフトへ変換する。
 *
 * @param song 変換元の管理用楽曲
 * @param genres ジャンルマスタ
 * @param difficulties 難易度マスタ
 * @returns 難易度マスタ順に譜面を並べた編集ドラフト
 */
export const toSongDraft = (
  song: ManagedSongDTO,
  genres: MasterItemDTO[],
  difficulties: MasterItemDTO[]
): SongDraft => {
  return {
    id: song.id,
    title: song.title,
    reading: song.reading ?? null,
    wiki_page_title: song.wiki_page_title ?? null,
    artist: song.artist,
    genre_id: findGenreIdByName(genres, song.genre),
    bpm: song.bpm ?? null,
    released_at: toDateOnly(song.release),
    jacket: song.jacket ?? null,
    is_new: readSongNewFlag(song),
    updated_at: song.updated_at,
    charts: difficulties
      .map((difficulty) => {
        const difficultyName = normalizePlayerDataDifficulty(difficulty.name)
        if (!difficultyName) return null

        const chart = song.charts[difficultyName]
        if (!chart) return null
        return {
          difficulty_id: difficulty.id,
          difficulty_name: difficultyName,
          const: String(chart.const),
          is_const_unknown: chart.is_const_unknown,
          notes: chart.notes ?? null,
          notes_designer: chart.notes_designer ?? null,
          updated_at: chart.updated_at ?? null,
        }
      })
      .filter((chart): chart is NonNullable<typeof chart> => chart !== null),
  }
}

/**
 * 通常楽曲の編集可能な値が選択時から変わったか判定する。
 *
 * @param current - 現在の編集値。
 * @param initial - 選択時の編集値。
 * @returns 編集可能な値に差がある場合は true。
 */
export const hasSongDraftChanges = (
  current: SongDraft | null,
  initial: SongDraft | null
): boolean => {
  if (!current || !initial) return false
  if (
    current.title !== initial.title ||
    current.reading !== initial.reading ||
    current.wiki_page_title !== initial.wiki_page_title ||
    current.artist !== initial.artist ||
    current.genre_id !== initial.genre_id ||
    current.bpm !== initial.bpm ||
    current.released_at !== initial.released_at ||
    current.jacket !== initial.jacket ||
    current.is_new !== initial.is_new ||
    current.charts.length !== initial.charts.length
  )
    return true

  return current.charts.some((chart, index) => {
    const original = initial.charts[index]
    return (
      chart.difficulty_id !== original.difficulty_id ||
      chart.const !== original.const ||
      chart.is_const_unknown !== original.is_const_unknown ||
      chart.notes !== original.notes ||
      chart.notes_designer !== original.notes_designer
    )
  })
}

/**
 * 編集ドラフトを検証し、通常楽曲の更新リクエストを組み立てる。
 *
 * @param draft 保存する編集ドラフト
 * @param genres ジャンルマスタ
 * @returns 更新リクエスト、または検証エラー文言
 */
export const buildUpdateSongRequest = (
  draft: SongDraft,
  genres: MasterItemDTO[]
): DraftRequestResult<UpdateSongRequestDTO> => {
  const normalizedReleasedAt = toDateOnly(draft.released_at)
  if (draft.released_at && !normalizedReleasedAt) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.releaseInvalid }
  }

  if (hasInvalidEditableChart(draft.charts)) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.editableChartInvalid }
  }

  return {
    ok: true,
    request: {
      id: draft.id,
      title: draft.title,
      reading: toNullableTrimmedString(draft.reading),
      wiki_page_title: toNullableTrimmedString(draft.wiki_page_title),
      artist: draft.artist,
      genre: findGenreNameById(genres, draft.genre_id),
      bpm: draft.bpm,
      released_at: normalizedReleasedAt,
      jacket: draft.jacket,
      is_new: draft.is_new,
      charts: Object.fromEntries(
        draft.charts.map((chart) => [
          chart.difficulty_name,
          {
            const: parseFloat(chart.const),
            is_const_unknown: chart.is_const_unknown,
            notes: chart.notes,
            notes_designer: toNullableTrimmedString(chart.notes_designer),
          },
        ])
      ),
    },
  }
}

/**
 * 追加ドラフトを検証し、通常楽曲の追加リクエストを組み立てる。
 *
 * @param draft 追加フォームのドラフト
 * @param genres ジャンルマスタ
 * @returns 追加リクエスト、または検証エラー文言
 */
export const buildCreateSongRequest = (
  draft: CreateSongDraft,
  genres: MasterItemDTO[]
): DraftRequestResult<CreateSongRequestDTO> => {
  if (!draft.official_idx.trim() || !draft.title.trim() || !draft.artist.trim()) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.requiredFieldsMissing }
  }

  if (draft.official_idx.trim().length > SONG_MANAGEMENT_INPUT_LIMITS.officialIdx) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.officialIdxTooLong }
  }

  const genreName = findGenreNameById(genres, draft.genre_id)
  if (!genreName) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.genreRequired }
  }

  if (draft.bpm !== null && draft.bpm < 0) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.bpmInvalid }
  }

  const invalidChart = draft.charts.find(
    (chart) =>
      chart.enabled && (parseFloat(chart.const) < 0 || (chart.notes !== null && chart.notes < 0))
  )
  if (invalidChart) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.createChartInvalid }
  }

  const normalizedReleasedAt = toDateOnly(draft.released_at)
  if (draft.released_at && !normalizedReleasedAt) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.releaseInvalid }
  }

  return {
    ok: true,
    request: {
      official_idx: draft.official_idx.trim(),
      title: draft.title.trim(),
      reading: toNullableTrimmedString(draft.reading),
      wiki_page_title: toNullableTrimmedString(draft.wiki_page_title),
      artist: draft.artist.trim(),
      genre: genreName,
      bpm: draft.bpm,
      released_at: normalizedReleasedAt,
      jacket: toNullableTrimmedString(draft.jacket),
      is_new: draft.is_new,
      charts: draft.charts
        .filter((chart) => chart.enabled)
        .map((chart) => ({
          difficulty: chart.difficulty_name,
          const: parseFloat(chart.const),
          is_const_unknown: chart.is_const_unknown,
          notes: chart.notes,
          notes_designer: toNullableTrimmedString(chart.notes_designer),
        })),
    },
  }
}

/**
 * 保存した通常楽曲ドラフトを管理用 DTO へ反映する。
 *
 * @param song - 現在の管理用楽曲
 * @param draft - 保存した編集ドラフト
 * @param genreName - ジャンル名。未解決なら既存値を維持する
 * @returns ドラフト内容を反映した管理用楽曲
 */
export const applySongDraftToManagedSong = (
  song: ManagedSongDTO,
  draft: SongDraft,
  genreName: string | null
): ManagedSongDTO => {
  const charts: ManagedSongDTO['charts'] = { ...song.charts }
  for (const chart of draft.charts) {
    const previous = song.charts[chart.difficulty_name]
    charts[chart.difficulty_name] = {
      const: parseFloat(chart.const),
      is_const_unknown: chart.is_const_unknown,
      notes: chart.notes,
      notes_designer: toNullableTrimmedString(chart.notes_designer),
      updated_at: previous?.updated_at ?? null,
    }
  }

  return {
    ...song,
    title: draft.title,
    reading: toNullableTrimmedString(draft.reading),
    wiki_page_title: toNullableTrimmedString(draft.wiki_page_title),
    artist: draft.artist,
    genre: genreName ?? song.genre,
    bpm: draft.bpm,
    release: toDateOnly(draft.released_at),
    jacket: draft.jacket,
    is_new: draft.is_new,
    charts,
  }
}
