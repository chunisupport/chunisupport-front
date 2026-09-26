import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../constants/chart'
import type {
  CreateWorldsendSongRequestDTO,
  ManagedWorldsendSongDTO,
  MasterItemDTO,
  UpdateWorldsendSongRequestDTO,
} from '../../../types/api'
import { SONG_MANAGEMENT_INPUT_LIMITS, SONG_MANAGEMENT_MESSAGES } from '../constants'
import {
  type DraftRequestResult,
  findGenreIdByName,
  findGenreNameById,
  readSongNewFlag,
  toDateOnly,
  toNullableTrimmedString,
} from './songDraftCommon'

/** 既存 WORLD'S END 楽曲の編集ドラフト */
export type WorldsendDraft = {
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
  attribute: string | null
  level_star: number | null
  notes: number | null
  notes_designer: string | null
  updated_at: string
  chart_updated_at: string | null
}

/** WORLD'S END 楽曲追加フォームのドラフト */
export type CreateWorldsendDraft = {
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
  attribute: string | null
  level_star: number | null
  notes: number | null
  notes_designer: string | null
}

/**
 * WORLD'S END 楽曲追加フォームの初期ドラフトを組み立てる。
 *
 * @returns すべて未入力の追加用ドラフト
 */
export const buildCreateWorldsendDraft = (): CreateWorldsendDraft => {
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
    attribute: null,
    level_star: null,
    notes: null,
    notes_designer: null,
  }
}

/**
 * 管理用の WORLD'S END 楽曲DTOを編集ドラフトへ変換する。
 *
 * @param song 変換元の管理用楽曲
 * @param genres ジャンルマスタ
 * @returns 楽曲と譜面の値をまとめた編集ドラフト
 */
export const toWorldsendDraft = (
  song: ManagedWorldsendSongDTO,
  genres: MasterItemDTO[]
): WorldsendDraft => {
  const chart = song.charts.WORLDSEND

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
    attribute: chart?.attribute ?? null,
    level_star: chart?.level_star ?? null,
    notes: chart?.notes ?? null,
    notes_designer: chart?.notes_designer ?? null,
    updated_at: song.updated_at,
    chart_updated_at: chart?.updated_at ?? null,
  }
}

/**
 * WORLD'S END 楽曲の編集可能な値が選択時から変わったか判定する。
 *
 * @param current - 現在の編集値。
 * @param initial - 選択時の編集値。
 * @returns 編集可能な値に差がある場合は true。
 */
export const hasWorldsendDraftChanges = (
  current: WorldsendDraft | null,
  initial: WorldsendDraft | null
): boolean => {
  if (!current || !initial) return false
  return (
    current.title !== initial.title ||
    current.reading !== initial.reading ||
    current.wiki_page_title !== initial.wiki_page_title ||
    current.artist !== initial.artist ||
    current.genre_id !== initial.genre_id ||
    current.bpm !== initial.bpm ||
    current.released_at !== initial.released_at ||
    current.jacket !== initial.jacket ||
    current.is_new !== initial.is_new ||
    current.attribute !== initial.attribute ||
    current.level_star !== initial.level_star ||
    current.notes !== initial.notes ||
    current.notes_designer !== initial.notes_designer
  )
}

/**
 * 編集ドラフトを検証し、WORLD'S END 楽曲の更新リクエストを組み立てる。
 *
 * @param draft 保存する編集ドラフト
 * @param genres ジャンルマスタ
 * @returns 更新リクエスト、または検証エラー文言
 */
export const buildUpdateWorldsendSongRequest = (
  draft: WorldsendDraft,
  genres: MasterItemDTO[]
): DraftRequestResult<UpdateWorldsendSongRequestDTO> => {
  const normalizedReleasedAt = toDateOnly(draft.released_at)
  if (draft.released_at && !normalizedReleasedAt) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.releaseInvalid }
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
      charts: {
        WORLDSEND: {
          attribute: toNullableTrimmedString(draft.attribute),
          level_star: draft.level_star,
          notes: draft.notes,
          notes_designer: toNullableTrimmedString(draft.notes_designer),
        },
      },
    },
  }
}

/**
 * 追加ドラフトを検証し、WORLD'S END 楽曲の追加リクエストを組み立てる。
 * 譜面項目がすべて未入力なら譜面は送信しない。
 *
 * @param draft 追加フォームのドラフト
 * @param genres ジャンルマスタ
 * @returns 追加リクエスト、または検証エラー文言
 */
export const buildCreateWorldsendSongRequest = (
  draft: CreateWorldsendDraft,
  genres: MasterItemDTO[]
): DraftRequestResult<CreateWorldsendSongRequestDTO> => {
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

  if (
    draft.level_star !== null &&
    (draft.level_star < WORLDSEND_LEVEL_STAR_MIN || draft.level_star > WORLDSEND_LEVEL_STAR_MAX)
  ) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.levelInvalid }
  }

  if (draft.notes !== null && draft.notes < 0) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.notesInvalid }
  }

  const normalizedReleasedAt = toDateOnly(draft.released_at)
  if (draft.released_at && !normalizedReleasedAt) {
    return { ok: false, message: SONG_MANAGEMENT_MESSAGES.releaseInvalid }
  }

  const hasChartInput = Boolean(
    draft.attribute?.trim() ||
      draft.level_star !== null ||
      draft.notes !== null ||
      draft.notes_designer?.trim()
  )

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
      chart: hasChartInput
        ? {
            attribute: toNullableTrimmedString(draft.attribute),
            level_star: draft.level_star,
            notes: draft.notes,
            notes_designer: toNullableTrimmedString(draft.notes_designer),
          }
        : undefined,
    },
  }
}

/**
 * 保存した WORLD'S END ドラフトを管理用 DTO へ反映する。
 *
 * @param song - 現在の管理用楽曲
 * @param draft - 保存した編集ドラフト
 * @param genreName - ジャンル名。未解決なら既存値を維持する
 * @returns ドラフト内容を反映した管理用楽曲
 */
export const applyWorldsendDraftToManagedSong = (
  song: ManagedWorldsendSongDTO,
  draft: WorldsendDraft,
  genreName: string | null
): ManagedWorldsendSongDTO => ({
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
  charts: {
    WORLDSEND: {
      attribute: toNullableTrimmedString(draft.attribute),
      level_star: draft.level_star,
      notes: draft.notes,
      notes_designer: toNullableTrimmedString(draft.notes_designer),
      updated_at: song.charts.WORLDSEND?.updated_at ?? null,
    },
  },
})
