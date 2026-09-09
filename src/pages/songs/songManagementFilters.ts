import type {
  ManagedSongDTO,
  ManagedWorldsendSongDTO,
  PlayerDataDifficulty,
  VersionSummaryDTO,
} from '../../types/api'
import { resolveVersionNameByReleaseDate } from '../../utils/versionConverter'

export type SongManagementMissingField = 'release' | 'bpm' | 'notes' | 'notesDesigner'

export type SongManagementFilters = {
  releaseMin: string
  releaseMax: string
  genres: string[] | null
  versions: string[] | null
  missingField: SongManagementMissingField
  missingOnly: boolean
}

export const SONG_MANAGEMENT_FILTER_LABELS = {
  title: 'フィルター',
  active: 'フィルター適用中',
  holdReset: 'フィルター リセット',
  cancel: 'キャンセル',
  apply: '適用',
  unselected: '未選択',
  release: '追加日',
  releaseMin: '追加日 開始',
  releaseMax: '追加日 終了',
  missingField: '欠落項目',
  missingOnly: '欠落のみ表示',
  rangeError: '開始日は終了日以前にしてください。',
} as const

export const SONG_MANAGEMENT_MISSING_FIELD_OPTIONS: readonly {
  value: SongManagementMissingField
  label: string
}[] = [
  { value: 'release', label: '追加日' },
  { value: 'bpm', label: 'BPM' },
  { value: 'notes', label: 'ノーツ数' },
  { value: 'notesDesigner', label: 'NOTES DESIGNER' },
]

const REQUIRED_STANDARD_DIFFICULTIES = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
] as const satisfies readonly PlayerDataDifficulty[]

const NOTES_DESIGNER_DIFFICULTIES = [
  'EXPERT',
  'MASTER',
] as const satisfies readonly PlayerDataDifficulty[]

/**
 * 楽曲管理フィルターの初期値を生成する。
 *
 * @returns 追加日を欠落対象にした未指定フィルター。
 */
export const createSongManagementFilters = (): SongManagementFilters => ({
  releaseMin: '',
  releaseMax: '',
  genres: null,
  versions: null,
  missingField: 'release',
  missingOnly: false,
})

/**
 * 文字列が未設定または空白だけか判定する。
 *
 * @param value - 判定する文字列。
 * @returns 欠落している場合は true。
 */
const isMissingText = (value: string | null | undefined): boolean => !value?.trim()

/**
 * 通常曲の指定項目に欠落があるか判定する。
 *
 * @param song - 判定対象の通常曲。
 * @param field - 欠落判定する項目。
 * @returns 対象項目が1つでも欠落している場合は true。
 */
export const hasMissingManagedSongField = (
  song: ManagedSongDTO,
  field: SongManagementMissingField
): boolean => {
  if (field === 'release') return isMissingText(song.release)
  if (field === 'bpm') return song.bpm === null

  const targetDifficulties =
    field === 'notes' ? REQUIRED_STANDARD_DIFFICULTIES : NOTES_DESIGNER_DIFFICULTIES
  const hasRequiredDifficultyMissing = targetDifficulties.some((difficulty) => {
    const chart = song.charts[difficulty]
    return field === 'notes'
      ? chart?.notes === null || !chart
      : isMissingText(chart?.notes_designer)
  })
  if (hasRequiredDifficultyMissing) return true

  const ultima = song.charts.ULTIMA
  if (!ultima) return false
  return field === 'notes' ? ultima.notes === null : isMissingText(ultima.notes_designer)
}

/**
 * WORLD'S END曲の指定項目に欠落があるか判定する。
 *
 * @param song - 判定対象のWORLD'S END曲。
 * @param field - 欠落判定する項目。
 * @returns 対象項目が欠落している場合は true。
 */
export const hasMissingManagedWorldsendSongField = (
  song: ManagedWorldsendSongDTO,
  field: SongManagementMissingField
): boolean => {
  if (field === 'release') return isMissingText(song.release)
  if (field === 'bpm') return song.bpm === null

  const chart = song.charts.WORLDSEND
  return field === 'notes' ? chart?.notes === null || !chart : isMissingText(chart?.notes_designer)
}

/**
 * 楽曲管理画面の共通属性条件を判定する。
 *
 * @param song - 判定対象の楽曲。
 * @param filters - 適用する管理画面フィルター。
 * @param versions - 追加日からバージョンを解決するための一覧。
 * @returns 共通属性条件をすべて満たす場合は true。
 */
const matchesManagementAttributes = (
  song: { genre: string | null; release: string | null },
  filters: SongManagementFilters,
  versions: readonly VersionSummaryDTO[]
): boolean => {
  const release = song.release?.slice(0, 10)
  if (filters.releaseMin && (!release || release < filters.releaseMin)) return false
  if (filters.releaseMax && (!release || release > filters.releaseMax)) return false
  if (filters.genres !== null && (song.genre === null || !filters.genres.includes(song.genre)))
    return false
  if (
    filters.versions !== null &&
    !filters.versions.includes(resolveVersionNameByReleaseDate(song.release, versions))
  )
    return false
  return true
}

/**
 * 通常曲を管理画面の属性・欠落条件で絞り込む。
 *
 * @param songs - 文字列検索後の通常曲。
 * @param filters - 適用する管理画面フィルター。
 * @param versions - 追加日からバージョンを解決するための一覧。
 * @returns 元の順序を保持した通常曲一覧。
 */
export const filterManagedSongs = (
  songs: ManagedSongDTO[],
  filters: SongManagementFilters,
  versions: readonly VersionSummaryDTO[]
): ManagedSongDTO[] =>
  songs.filter(
    (song) =>
      matchesManagementAttributes(song, filters, versions) &&
      (!filters.missingOnly || hasMissingManagedSongField(song, filters.missingField))
  )

/**
 * WORLD'S END曲を管理画面の属性・欠落条件で絞り込む。
 *
 * @param songs - 文字列検索後のWORLD'S END曲。
 * @param filters - 適用する管理画面フィルター。
 * @param versions - 追加日からバージョンを解決するための一覧。
 * @returns 元の順序を保持したWORLD'S END曲一覧。
 */
export const filterManagedWorldsendSongs = (
  songs: ManagedWorldsendSongDTO[],
  filters: SongManagementFilters,
  versions: readonly VersionSummaryDTO[]
): ManagedWorldsendSongDTO[] =>
  songs.filter(
    (song) =>
      matchesManagementAttributes(song, filters, versions) &&
      (!filters.missingOnly || hasMissingManagedWorldsendSongField(song, filters.missingField))
  )
