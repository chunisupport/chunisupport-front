import { Search } from 'lucide-solid'
import { createEffect, createMemo, createResource, createSignal, For, Index, Show } from 'solid-js'
import {
  createSong,
  createWorldsendSong,
  deleteSongByDisplayId,
  deleteWorldsendSongByDisplayId,
  fetchManagedSongs,
  fetchManagedWorldsendSongs,
  fetchMasterData,
  restoreSongByDisplayId,
  restoreWorldsendSongByDisplayId,
  updateSongs,
  updateWorldsendSongs,
} from '../../api/songs'
import { Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type {
  CreateSongRequestDTO,
  CreateWorldsendSongRequestDTO,
  ManagedSongDTO,
  ManagedWorldsendSongDTO,
  MasterItemDTO,
  SongDTO,
  UpdateSongRequestDTO,
  UpdateWorldsendSongRequestDTO,
} from '../../types/api'
import { buildSearchableItems, filterSearchableItems } from './searchHelpers'

type SongManagementPageProps = {
  title: string
}

type EditableChartDraft = {
  difficulty_id: number
  difficulty_name: string
  const: string
  is_const_unknown: boolean
  notes: number | null
  notes_designer: string | null
  updated_at: string | null
}

type SongDraft = {
  id: string
  title: string
  reading: string | null
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  updated_at: string
  charts: EditableChartDraft[]
}

type WorldsendDraft = {
  id: string
  title: string
  reading: string | null
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  attribute: string | null
  level_star: number | null
  notes: number | null
  notes_designer: string | null
  updated_at: string
  chart_updated_at: string | null
}

type CreateSongChartDraft = {
  difficulty_name: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA'
  enabled: boolean
  const: string
  is_const_unknown: boolean
  notes: number | null
  notes_designer: string | null
}

type CreateSongDraft = {
  official_idx: string
  title: string
  reading: string | null
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  charts: CreateSongChartDraft[]
}

type CreateWorldsendDraft = {
  official_idx: string
  title: string
  reading: string | null
  artist: string
  genre_id: number | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  attribute: string | null
  level_star: number | null
  notes: number | null
  notes_designer: string | null
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tokyo',
})

const toDateOnly = (value: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  if (dateOnlyPattern.test(trimmed)) {
    return trimmed
  }

  const datePrefixMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (datePrefixMatch && dateOnlyPattern.test(datePrefixMatch[1])) {
    return datePrefixMatch[1]
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

const toDateInputValue = (value: string | null): string => {
  return toDateOnly(value) ?? ''
}

const formatUpdatedAt = (value: string | null | undefined): string => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return dateTimeFormatter.format(date)
}

const editableDifficulties = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const

const toNullableTrimmedString = (value: string | null): string | null => {
  return value?.trim() ? value.trim() : null
}

const buildCreateSongDraft = (): CreateSongDraft => {
  return {
    official_idx: '',
    title: '',
    reading: null,
    artist: '',
    genre_id: null,
    bpm: null,
    released_at: null,
    jacket: null,
    charts: editableDifficulties.map((difficultyName) => ({
      difficulty_name: difficultyName,
      enabled: false,
      const: '0',
      is_const_unknown: false,
      notes: null,
      notes_designer: null,
    })),
  }
}

const buildCreateWorldsendDraft = (): CreateWorldsendDraft => {
  return {
    official_idx: '',
    title: '',
    reading: null,
    artist: '',
    genre_id: null,
    bpm: null,
    released_at: null,
    jacket: null,
    attribute: null,
    level_star: null,
    notes: null,
    notes_designer: null,
  }
}

const toSongDraft = (
  song: ManagedSongDTO,
  genres: MasterItemDTO[],
  difficulties: MasterItemDTO[]
): SongDraft => {
  return {
    id: song.id,
    title: song.title,
    reading: song.reading ?? null,
    artist: song.artist,
    genre_id: genres.find((genre) => genre.name === song.genre)?.id ?? null,
    bpm: song.bpm ?? null,
    released_at: toDateOnly(song.release),
    jacket: song.jacket ?? null,
    updated_at: song.updated_at,
    charts: difficulties
      .map((difficulty) => {
        const chart = song.charts[difficulty.name as keyof SongDTO['charts']]
        if (!chart) return null
        return {
          difficulty_id: difficulty.id,
          difficulty_name: difficulty.name,
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

const toWorldsendDraft = (
  song: ManagedWorldsendSongDTO,
  genres: MasterItemDTO[]
): WorldsendDraft => {
  const chart = song.charts.WORLDSEND

  return {
    id: song.id,
    title: song.title,
    reading: song.reading ?? null,
    artist: song.artist,
    genre_id: genres.find((genre) => genre.name === song.genre)?.id ?? null,
    bpm: song.bpm ?? null,
    released_at: toDateOnly(song.release),
    jacket: song.jacket ?? null,
    attribute: chart?.attribute ?? null,
    level_star: chart?.level_star ?? null,
    notes: chart?.notes ?? null,
    notes_designer: chart?.notes_designer ?? null,
    updated_at: song.updated_at,
    chart_updated_at: chart?.updated_at ?? null,
  }
}

/**
 * 管理者向けの楽曲管理画面を描画します。
 * 通常楽曲およびWORLD'S END楽曲の追加・更新・削除・復活操作を提供します。
 *
 * @param props 画面タイトルを含むプロパティ
 * @returns 楽曲管理UI
 */
const SongManagementPage = (props: SongManagementPageProps) => {
  useDocumentTitle(props.title)

  const [refreshKey, setRefreshKey] = createSignal(0)
  const [songsResponse] = createResource(() => refreshKey(), fetchManagedSongs)
  const [worldsendResponse] = createResource(() => refreshKey(), fetchManagedWorldsendSongs)
  const [masterData] = createResource(fetchMasterData)

  const [selectedSongId, setSelectedSongId] = createSignal<string>('')
  const [selectedWorldsendSongId, setSelectedWorldsendSongId] = createSignal<string>('')
  const [draft, setDraft] = createSignal<SongDraft | null>(null)
  const [worldsendDraft, setWorldsendDraft] = createSignal<WorldsendDraft | null>(null)
  const [createSongDraft, setCreateSongDraft] = createSignal<CreateSongDraft>(
    buildCreateSongDraft()
  )
  const [createWorldsendDraft, setCreateWorldsendDraft] = createSignal<CreateWorldsendDraft>(
    buildCreateWorldsendDraft()
  )
  const [message, setMessage] = createSignal('')
  const [errorMessage, setErrorMessage] = createSignal('')
  const [songSearchQuery, setSongSearchQuery] = createSignal('')
  const [worldsendSearchQuery, setWorldsendSearchQuery] = createSignal('')

  const songs = createMemo<ManagedSongDTO[]>(() => songsResponse()?.songs ?? [])
  const searchableSongs = createMemo(() => buildSearchableItems(songs()))
  const filteredSongs = createMemo(() =>
    filterSearchableItems(searchableSongs(), songSearchQuery())
  )
  const worldsendSongs = createMemo<ManagedWorldsendSongDTO[]>(
    () => worldsendResponse()?.songs ?? []
  )
  const searchableWorldsendSongs = createMemo(() => buildSearchableItems(worldsendSongs()))
  const filteredWorldsendSongs = createMemo(() =>
    filterSearchableItems(searchableWorldsendSongs(), worldsendSearchQuery())
  )
  const selectedSong = createMemo(() => {
    const selected = selectedSongId()
    if (!selected) return null
    return songs().find((item) => item.id === selected) ?? null
  })
  const selectedWorldsendSong = createMemo(() => {
    const selected = selectedWorldsendSongId()
    if (!selected) return null
    return worldsendSongs().find((item) => item.id === selected) ?? null
  })

  createEffect(() => {
    const song = selectedSong()
    const md = masterData()
    if (!song || !md) {
      setDraft(null)
      return
    }

    setDraft(toSongDraft(song, md.genres, md.difficulties))
  })

  createEffect(() => {
    const song = selectedWorldsendSong()
    const md = masterData()
    if (!song || !md) {
      setWorldsendDraft(null)
      return
    }

    setWorldsendDraft(toWorldsendDraft(song, md.genres))
  })

  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId)
  }

  const handleSelectWorldsendSong = (songId: string) => {
    setSelectedWorldsendSongId(songId)
  }

  const updateDraftField = <K extends keyof SongDraft>(key: K, value: SongDraft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updateWorldsendDraftField = <K extends keyof WorldsendDraft>(
    key: K,
    value: WorldsendDraft[K]
  ) => {
    setWorldsendDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updateDraftChart = (
    difficultyId: number,
    key: 'const' | 'is_const_unknown' | 'notes' | 'notes_designer',
    value: number | boolean | string | null
  ) => {
    setDraft((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        charts: prev.charts.map((chart) =>
          chart.difficulty_id === difficultyId ? { ...chart, [key]: value } : chart
        ),
      }
    })
  }

  const updateWorldsendChart = (
    key: 'attribute' | 'level_star' | 'notes' | 'notes_designer',
    value: string | number | null
  ) => {
    setWorldsendDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const updateCreateSongDraftField = <K extends keyof CreateSongDraft>(
    key: K,
    value: CreateSongDraft[K]
  ) => {
    setCreateSongDraft((prev) => ({ ...prev, [key]: value }))
  }

  const updateCreateSongChart = (
    chartIndex: number,
    key: 'enabled' | 'const' | 'is_const_unknown' | 'notes' | 'notes_designer',
    value: boolean | number | string | null
  ) => {
    setCreateSongDraft((prev) => ({
      ...prev,
      charts: prev.charts.map((chart, index) =>
        index === chartIndex ? { ...chart, [key]: value } : chart
      ),
    }))
  }

  const updateCreateWorldsendDraftField = <K extends keyof CreateWorldsendDraft>(
    key: K,
    value: CreateWorldsendDraft[K]
  ) => {
    setCreateWorldsendDraft((prev) => ({ ...prev, [key]: value }))
  }

  const refresh = () => setRefreshKey((prev) => prev + 1)

  const handleSave = async () => {
    const current = draft()
    if (!current) return

    setMessage('')
    setErrorMessage('')

    const md = masterData()
    if (!md) {
      setErrorMessage('マスターデータの取得前のため更新できません。再読み込みしてください。')
      return
    }

    const normalizedReleasedAt = toDateOnly(current.released_at)
    if (current.released_at && !normalizedReleasedAt) {
      setErrorMessage('リリース日の形式が不正です。日付を入力し直してください。')
      return
    }

    const request: UpdateSongRequestDTO = {
      id: current.id,
      title: current.title,
      reading: toNullableTrimmedString(current.reading),
      artist: current.artist,
      genre: md.genres.find((genre) => genre.id === current.genre_id)?.name ?? null,
      bpm: current.bpm,
      released_at: normalizedReleasedAt,
      jacket: current.jacket,
      charts: Object.fromEntries(
        current.charts.map((chart) => [
          chart.difficulty_name,
          {
            const: parseFloat(chart.const),
            is_const_unknown: chart.is_const_unknown,
            notes: chart.notes,
            notes_designer: chart.notes_designer?.trim() ? chart.notes_designer.trim() : null,
          },
        ])
      ),
    }

    try {
      await updateSongs([request])
      setMessage('楽曲を更新しました。')
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '更新に失敗しました。')
    }
  }

  const handleCreateSong = async () => {
    const current = createSongDraft()

    setMessage('')
    setErrorMessage('')

    const md = masterData()
    if (!md) {
      setErrorMessage('マスターデータの取得前のため追加できません。再読み込みしてください。')
      return
    }

    if (!current.official_idx.trim() || !current.title.trim() || !current.artist.trim()) {
      setErrorMessage('公式ID・タイトル・アーティストは必須です。')
      return
    }

    if (current.official_idx.trim().length > 10) {
      setErrorMessage('公式IDは10文字以内で入力してください。')
      return
    }

    const genreName = md.genres.find((genre) => genre.id === current.genre_id)?.name
    if (!genreName) {
      setErrorMessage('ジャンルを選択してください。')
      return
    }

    if (current.bpm !== null && current.bpm < 0) {
      setErrorMessage('BPMは0以上で入力してください。')
      return
    }

    const invalidChart = current.charts.find(
      (chart) =>
        chart.enabled && (parseFloat(chart.const) < 0 || (chart.notes !== null && chart.notes < 0))
    )
    if (invalidChart) {
      setErrorMessage('追加する譜面の定数・ノーツは0以上で入力してください。')
      return
    }

    const normalizedReleasedAt = toDateOnly(current.released_at)
    if (current.released_at && !normalizedReleasedAt) {
      setErrorMessage('リリース日の形式が不正です。日付を入力し直してください。')
      return
    }

    const request: CreateSongRequestDTO = {
      official_idx: current.official_idx.trim(),
      title: current.title.trim(),
      reading: toNullableTrimmedString(current.reading),
      artist: current.artist.trim(),
      genre: genreName,
      bpm: current.bpm,
      released_at: normalizedReleasedAt,
      jacket: current.jacket?.trim() ? current.jacket.trim() : null,
      charts: current.charts
        .filter((chart) => chart.enabled)
        .map((chart) => ({
          difficulty: chart.difficulty_name,
          const: parseFloat(chart.const),
          is_const_unknown: chart.is_const_unknown,
          notes: chart.notes,
          notes_designer: chart.notes_designer?.trim() ? chart.notes_designer.trim() : null,
        })),
    }

    try {
      await createSong(request)
      setMessage('通常楽曲を追加しました。')
      setCreateSongDraft(buildCreateSongDraft())
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '追加に失敗しました。')
    }
  }

  const handleCreateWorldsendSong = async () => {
    const current = createWorldsendDraft()

    setMessage('')
    setErrorMessage('')

    const md = masterData()
    if (!md) {
      setErrorMessage('マスターデータの取得前のため追加できません。再読み込みしてください。')
      return
    }

    if (!current.official_idx.trim() || !current.title.trim() || !current.artist.trim()) {
      setErrorMessage('公式ID・タイトル・アーティストは必須です。')
      return
    }

    if (current.official_idx.trim().length > 10) {
      setErrorMessage('公式IDは10文字以内で入力してください。')
      return
    }

    const genreName = md.genres.find((genre) => genre.id === current.genre_id)?.name
    if (!genreName) {
      setErrorMessage('ジャンルを選択してください。')
      return
    }

    if (current.bpm !== null && current.bpm < 0) {
      setErrorMessage('BPMは0以上で入力してください。')
      return
    }

    if (current.level_star !== null && (current.level_star < 1 || current.level_star > 5)) {
      setErrorMessage("WORLD'S ENDレベルは1〜5で入力してください。")
      return
    }

    if (current.notes !== null && current.notes < 0) {
      setErrorMessage('ノーツは0以上で入力してください。')
      return
    }

    const normalizedReleasedAt = toDateOnly(current.released_at)
    if (current.released_at && !normalizedReleasedAt) {
      setErrorMessage('リリース日の形式が不正です。日付を入力し直してください。')
      return
    }

    const hasChartInput = Boolean(
      current.attribute?.trim() ||
        current.level_star !== null ||
        current.notes !== null ||
        current.notes_designer?.trim()
    )

    const request: CreateWorldsendSongRequestDTO = {
      official_idx: current.official_idx.trim(),
      title: current.title.trim(),
      reading: toNullableTrimmedString(current.reading),
      artist: current.artist.trim(),
      genre: genreName,
      bpm: current.bpm,
      released_at: normalizedReleasedAt,
      jacket: current.jacket?.trim() ? current.jacket.trim() : null,
      chart: hasChartInput
        ? {
            attribute: current.attribute?.trim() ? current.attribute.trim() : null,
            level_star: current.level_star,
            notes: current.notes,
            notes_designer: current.notes_designer?.trim() ? current.notes_designer.trim() : null,
          }
        : undefined,
    }

    try {
      await createWorldsendSong(request)
      setMessage("WORLD'S END楽曲を追加しました。")
      setCreateWorldsendDraft(buildCreateWorldsendDraft())
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '追加に失敗しました。')
    }
  }

  const handleSaveWorldsend = async () => {
    const current = worldsendDraft()
    if (!current) return

    setMessage('')
    setErrorMessage('')

    const md = masterData()
    if (!md) {
      setErrorMessage('マスターデータの取得前のため更新できません。再読み込みしてください。')
      return
    }

    const normalizedReleasedAt = toDateOnly(current.released_at)
    if (current.released_at && !normalizedReleasedAt) {
      setErrorMessage('リリース日の形式が不正です。日付を入力し直してください。')
      return
    }

    const request: UpdateWorldsendSongRequestDTO = {
      id: current.id,
      title: current.title,
      reading: toNullableTrimmedString(current.reading),
      artist: current.artist,
      genre: md.genres.find((genre) => genre.id === current.genre_id)?.name ?? null,
      bpm: current.bpm,
      released_at: normalizedReleasedAt,
      jacket: current.jacket,
      charts: {
        WORLDSEND: {
          attribute: current.attribute?.trim() ? current.attribute.trim() : null,
          level_star: current.level_star,
          notes: current.notes,
          notes_designer: current.notes_designer?.trim() ? current.notes_designer.trim() : null,
        },
      },
    }

    try {
      await updateWorldsendSongs([request])
      setMessage("WORLD'S END楽曲を更新しました。")
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '更新に失敗しました。')
    }
  }

  const handleDeleteSong = async (displayId: string) => {
    if (!window.confirm('この楽曲を削除しますか？')) return
    setMessage('')
    setErrorMessage('')
    try {
      await deleteSongByDisplayId(displayId)
      setMessage('楽曲を削除しました。')
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました。')
    }
  }

  const handleRestoreSong = async (displayId: string) => {
    setMessage('')
    setErrorMessage('')
    try {
      await restoreSongByDisplayId(displayId)
      setMessage('楽曲を復活しました。')
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '復活に失敗しました。')
    }
  }

  const handleDeleteWorldsendSong = async (displayId: string) => {
    if (!window.confirm("このWORLD'S END楽曲を削除しますか？")) return
    setMessage('')
    setErrorMessage('')
    try {
      await deleteWorldsendSongByDisplayId(displayId)
      setMessage("WORLD'S END楽曲を削除しました。")
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '削除に失敗しました。')
    }
  }

  const handleRestoreWorldsendSong = async (displayId: string) => {
    setMessage('')
    setErrorMessage('')
    try {
      await restoreWorldsendSongByDisplayId(displayId)
      setMessage("WORLD'S END楽曲を復活しました。")
      refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '復活に失敗しました。')
    }
  }

  return (
    <div class="song-management mx-auto w-full max-w-6xl p-4 space-y-6">
      <style>{`
        .song-management input[type='number'] {
          appearance: textfield;
          -moz-appearance: textfield;
        }

        .song-management input[type='number']::-webkit-outer-spin-button,
        .song-management input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      <div>
        <h1 class="text-2xl font-semibold">{props.title}</h1>
        <p class="mt-2 text-sm text-text-muted">
          API仕様準拠: 通常楽曲・WORLD&apos;S END ともに追加・編集・削除・復活に対応します。
        </p>
      </div>

      <Show when={message()}>
        <p class="rounded border border-success-border bg-success-bg px-3 py-2 text-sm text-success">
          {message()}
        </p>
      </Show>
      <Show when={errorMessage()}>
        <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
          {errorMessage()}
        </p>
      </Show>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-lg font-semibold">通常楽曲（編集 / 削除 / 復活）</h2>

        <Show
          when={!songsResponse.loading && !masterData.loading && songs().length > 0}
          fallback={
            <div class="mt-3 h-20">
              <Loading />
            </div>
          }
        >
          <div class="mt-3 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div class="min-w-0">
              <div class="mb-2 flex items-center gap-2 rounded border border-border-strong px-2 focus-within:border-focus-ring">
                <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
                <input
                  type="search"
                  value={songSearchQuery()}
                  onInput={(event) => setSongSearchQuery(event.currentTarget.value)}
                  placeholder="曲名・アーティスト名で検索"
                  class="min-w-0 flex-1 py-2 text-sm outline-none"
                />
              </div>
              <div class="max-h-130 overflow-y-auto rounded border border-border">
                <ul class="divide-y divide-border">
                  <For each={filteredSongs()}>
                    {(song) => {
                      const isSelected = () => song.id === selectedSongId()
                      return (
                        <li>
                          <button
                            type="button"
                            class="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                            classList={{
                              'bg-info-bg': isSelected(),
                              'bg-danger-bg': song.is_deleted && !isSelected(),
                            }}
                            onClick={() => handleSelectSong(song.id)}
                          >
                            <p class="font-sans font-medium text-text">{song.title}</p>
                            <p class="font-sans text-xs text-text-muted">{song.artist}</p>
                          </button>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </div>
            </div>

            <div class="min-w-0">
              <Show when={draft()}>
                {(currentDraft) => (
                  <div class="min-w-0 space-y-4">
                    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">更新日時</span>
                        <input
                          value={formatUpdatedAt(currentDraft().updated_at)}
                          class="w-full rounded border border-border-strong bg-surface-hover px-3 py-2 text-text-muted"
                          disabled
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">タイトル</span>
                        <input
                          value={currentDraft().title}
                          onInput={(event) => updateDraftField('title', event.currentTarget.value)}
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">読み</span>
                        <input
                          value={currentDraft().reading ?? ''}
                          maxLength={300}
                          onInput={(event) =>
                            updateDraftField(
                              'reading',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">アーティスト</span>
                        <input
                          value={currentDraft().artist}
                          onInput={(event) => updateDraftField('artist', event.currentTarget.value)}
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">ジャンル</span>
                        <select
                          value={String(currentDraft().genre_id ?? '')}
                          onChange={(event) =>
                            updateDraftField(
                              'genre_id',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        >
                          <option value="">未設定</option>
                          <For each={masterData()?.genres ?? []}>
                            {(genre) => <option value={genre.id}>{genre.name}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">BPM</span>
                        <input
                          type="number"
                          value={currentDraft().bpm ?? ''}
                          onInput={(event) =>
                            updateDraftField(
                              'bpm',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">リリース日</span>
                        <input
                          type="date"
                          value={toDateInputValue(currentDraft().released_at)}
                          onInput={(event) =>
                            updateDraftField(
                              'released_at',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">ジャケットID</span>
                        <input
                          value={currentDraft().jacket ?? ''}
                          onInput={(event) =>
                            updateDraftField(
                              'jacket',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                    </div>

                    <div class="overflow-x-auto rounded border border-border">
                      <table class="min-w-full text-sm">
                        <thead class="bg-surface-muted">
                          <tr>
                            <th class="whitespace-nowrap px-3 py-2 text-left">難易度</th>
                            <th class="whitespace-nowrap px-3 py-2 text-left">定数</th>
                            <th class="whitespace-nowrap px-3 py-2 text-left">未確定</th>
                            <th class="whitespace-nowrap px-3 py-2 text-left">ノーツ</th>
                            <th class="whitespace-nowrap px-3 py-2 text-left">NOTES DESIGNER</th>
                            <th class="whitespace-nowrap px-3 py-2 text-left">更新日時</th>
                          </tr>
                        </thead>
                        <tbody>
                          <Index each={currentDraft().charts}>
                            {(chart) => (
                              <tr class="border-t border-border">
                                <td class="px-3 py-2">{chart().difficulty_name}</td>
                                <td class="px-3 py-2">
                                  <input
                                    type="text"
                                    inputmode="decimal"
                                    value={chart().const}
                                    onInput={(event) =>
                                      updateDraftChart(
                                        chart().difficulty_id,
                                        'const',
                                        event.currentTarget.value
                                      )
                                    }
                                    class="w-20 rounded border border-border-strong px-2 py-1"
                                  />
                                </td>
                                <td class="px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={chart().is_const_unknown}
                                    onChange={(event) =>
                                      updateDraftChart(
                                        chart().difficulty_id,
                                        'is_const_unknown',
                                        event.currentTarget.checked
                                      )
                                    }
                                  />
                                </td>
                                <td class="px-3 py-2">
                                  <input
                                    type="number"
                                    value={chart().notes ?? ''}
                                    onInput={(event) =>
                                      updateDraftChart(
                                        chart().difficulty_id,
                                        'notes',
                                        event.currentTarget.value === ''
                                          ? null
                                          : Number(event.currentTarget.value)
                                      )
                                    }
                                    class="w-20 rounded border border-border-strong px-2 py-1"
                                  />
                                </td>
                                <td class="px-3 py-2">
                                  <input
                                    value={chart().notes_designer ?? ''}
                                    onInput={(event) =>
                                      updateDraftChart(
                                        chart().difficulty_id,
                                        'notes_designer',
                                        event.currentTarget.value.trim() === ''
                                          ? null
                                          : event.currentTarget.value
                                      )
                                    }
                                    class="w-48 rounded border border-border-strong px-2 py-1 font-sans"
                                  />
                                </td>
                                <td class="px-3 py-2">
                                  <input
                                    value={formatUpdatedAt(chart().updated_at)}
                                    class="w-40 rounded border border-border-strong bg-surface-hover px-2 py-1 text-text-muted"
                                    disabled
                                  />
                                </td>
                              </tr>
                            )}
                          </Index>
                        </tbody>
                      </table>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded bg-info px-4 py-2 text-sm font-medium text-text-inverse hover:bg-info"
                        onClick={handleSave}
                      >
                        更新する
                      </button>
                      <Show
                        when={!selectedSong()?.is_deleted}
                        fallback={
                          <button
                            type="button"
                            class="rounded bg-success px-4 py-2 text-sm font-medium text-text-inverse hover:bg-success"
                            onClick={() => handleRestoreSong(currentDraft().id)}
                          >
                            復活する
                          </button>
                        }
                      >
                        <button
                          type="button"
                          class="rounded bg-danger px-4 py-2 text-sm font-medium text-text-inverse hover:bg-danger-hover"
                          onClick={() => handleDeleteSong(currentDraft().id)}
                        >
                          削除する
                        </button>
                      </Show>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </Show>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-lg font-semibold">WORLD&apos;S END（編集 / 削除 / 復活）</h2>

        <Show
          when={!worldsendResponse.loading && !masterData.loading && worldsendSongs().length > 0}
          fallback={
            <div class="mt-3 h-20">
              <Loading />
            </div>
          }
        >
          <div class="mt-3 grid gap-4 lg:grid-cols-[300px_1fr]">
            <div>
              <div class="mb-2 flex items-center gap-2 rounded border border-border-strong px-2 focus-within:border-focus-ring">
                <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
                <input
                  type="search"
                  value={worldsendSearchQuery()}
                  onInput={(event) => setWorldsendSearchQuery(event.currentTarget.value)}
                  placeholder="曲名・アーティスト名で検索"
                  class="min-w-0 flex-1 py-2 text-sm outline-none"
                />
              </div>
              <div class="max-h-130 overflow-y-auto rounded border border-border">
                <ul class="divide-y divide-border">
                  <For each={filteredWorldsendSongs()}>
                    {(song) => {
                      const isSelected = () => song.id === selectedWorldsendSongId()
                      return (
                        <li>
                          <button
                            type="button"
                            class="w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                            classList={{
                              'bg-info-bg': isSelected(),
                              'bg-danger-bg': song.is_deleted && !isSelected(),
                            }}
                            onClick={() => handleSelectWorldsendSong(song.id)}
                          >
                            <p class="font-sans font-medium text-text">{song.title}</p>
                            <p class="font-sans text-xs text-text-muted">{song.artist}</p>
                          </button>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </div>
            </div>

            <div>
              <Show when={worldsendDraft()}>
                {(currentDraft) => (
                  <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">更新日時</span>
                        <input
                          value={formatUpdatedAt(currentDraft().updated_at)}
                          class="w-full rounded border border-border-strong bg-surface-hover px-3 py-2 text-text-muted"
                          disabled
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">タイトル</span>
                        <input
                          value={currentDraft().title}
                          onInput={(event) =>
                            updateWorldsendDraftField('title', event.currentTarget.value)
                          }
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">読み</span>
                        <input
                          value={currentDraft().reading ?? ''}
                          maxLength={300}
                          onInput={(event) =>
                            updateWorldsendDraftField(
                              'reading',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">アーティスト</span>
                        <input
                          value={currentDraft().artist}
                          onInput={(event) =>
                            updateWorldsendDraftField('artist', event.currentTarget.value)
                          }
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">ジャンル</span>
                        <select
                          value={String(currentDraft().genre_id ?? '')}
                          onChange={(event) =>
                            updateWorldsendDraftField(
                              'genre_id',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        >
                          <option value="">未設定</option>
                          <For each={masterData()?.genres ?? []}>
                            {(genre) => <option value={genre.id}>{genre.name}</option>}
                          </For>
                        </select>
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">BPM</span>
                        <input
                          type="number"
                          value={currentDraft().bpm ?? ''}
                          onInput={(event) =>
                            updateWorldsendDraftField(
                              'bpm',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">リリース日</span>
                        <input
                          type="date"
                          value={toDateInputValue(currentDraft().released_at)}
                          onInput={(event) =>
                            updateWorldsendDraftField(
                              'released_at',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="text-sm">
                        <span class="mb-1 block text-text-muted">ジャケットID</span>
                        <input
                          value={currentDraft().jacket ?? ''}
                          onInput={(event) =>
                            updateWorldsendDraftField(
                              'jacket',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">属性</span>
                        <input
                          value={currentDraft().attribute ?? ''}
                          onInput={(event) =>
                            updateWorldsendChart(
                              'attribute',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">レベル</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={currentDraft().level_star ?? ''}
                          onInput={(event) =>
                            updateWorldsendChart(
                              'level_star',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">ノーツ</span>
                        <input
                          type="number"
                          min="0"
                          value={currentDraft().notes ?? ''}
                          onInput={(event) =>
                            updateWorldsendChart(
                              'notes',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2"
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">譜面更新日時</span>
                        <input
                          value={formatUpdatedAt(currentDraft().chart_updated_at)}
                          class="w-full rounded border border-border-strong bg-surface-hover px-3 py-2 text-text-muted"
                          disabled
                        />
                      </label>
                      <label class="col-span-2 text-sm">
                        <span class="mb-1 block text-text-muted">NOTES DESIGNER</span>
                        <input
                          value={currentDraft().notes_designer ?? ''}
                          onInput={(event) =>
                            updateWorldsendChart(
                              'notes_designer',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-full rounded border border-border-strong px-3 py-2 font-sans"
                        />
                      </label>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="rounded bg-info px-4 py-2 text-sm font-medium text-text-inverse hover:bg-info"
                        onClick={handleSaveWorldsend}
                      >
                        更新する
                      </button>
                      <Show
                        when={!selectedWorldsendSong()?.is_deleted}
                        fallback={
                          <button
                            type="button"
                            class="rounded bg-success px-4 py-2 text-sm font-medium text-text-inverse hover:bg-success"
                            onClick={() => handleRestoreWorldsendSong(currentDraft().id)}
                          >
                            復活する
                          </button>
                        }
                      >
                        <button
                          type="button"
                          class="rounded bg-danger px-4 py-2 text-sm font-medium text-text-inverse hover:bg-danger-hover"
                          onClick={() => handleDeleteWorldsendSong(currentDraft().id)}
                        >
                          削除する
                        </button>
                      </Show>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </Show>

        <Show when={!worldsendResponse.loading && worldsendSongs().length === 0}>
          <p class="mt-3 text-sm text-text-subtle">WORLD&apos;S END楽曲がありません。</p>
        </Show>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-lg font-semibold">通常楽曲を追加</h2>
        <div class="mt-3 space-y-4">
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">公式ID</span>
              <input
                value={createSongDraft().official_idx}
                maxLength={10}
                onInput={(event) =>
                  updateCreateSongDraftField('official_idx', event.currentTarget.value)
                }
                class="w-full rounded border border-border-strong px-3 py-2"
                placeholder="1234567890"
              />
            </label>
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">タイトル</span>
              <input
                value={createSongDraft().title}
                onInput={(event) => updateCreateSongDraftField('title', event.currentTarget.value)}
                class="w-full rounded border border-border-strong px-3 py-2 font-sans"
              />
            </label>
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">読み</span>
              <input
                value={createSongDraft().reading ?? ''}
                maxLength={300}
                onInput={(event) =>
                  updateCreateSongDraftField(
                    'reading',
                    event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                  )
                }
                class="w-full rounded border border-border-strong px-3 py-2 font-sans"
              />
            </label>
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">アーティスト</span>
              <input
                value={createSongDraft().artist}
                onInput={(event) => updateCreateSongDraftField('artist', event.currentTarget.value)}
                class="w-full rounded border border-border-strong px-3 py-2 font-sans"
              />
            </label>
            <div class="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3 lg:grid-cols-4">
              <label class="text-sm">
                <span class="mb-1 block text-text-muted">ジャンル</span>
                <select
                  value={String(createSongDraft().genre_id ?? '')}
                  onChange={(event) =>
                    updateCreateSongDraftField(
                      'genre_id',
                      event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
                    )
                  }
                  class="w-full rounded border border-border-strong px-3 py-2"
                >
                  <option value="">選択してください</option>
                  <For each={masterData()?.genres ?? []}>
                    {(genre) => <option value={genre.id}>{genre.name}</option>}
                  </For>
                </select>
              </label>
              <label class="text-sm">
                <span class="mb-1 block text-text-muted">BPM</span>
                <input
                  type="number"
                  value={createSongDraft().bpm ?? ''}
                  onInput={(event) =>
                    updateCreateSongDraftField(
                      'bpm',
                      event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
                    )
                  }
                  class="w-full rounded border border-border-strong px-3 py-2"
                />
              </label>
              <label class="text-sm">
                <span class="mb-1 block text-text-muted">リリース日</span>
                <input
                  type="date"
                  value={toDateInputValue(createSongDraft().released_at)}
                  onInput={(event) =>
                    updateCreateSongDraftField(
                      'released_at',
                      event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                    )
                  }
                  class="w-full rounded border border-border-strong px-3 py-2"
                />
              </label>
              <label class="text-sm">
                <span class="mb-1 block text-text-muted">ジャケットID</span>
                <input
                  value={createSongDraft().jacket ?? ''}
                  onInput={(event) =>
                    updateCreateSongDraftField(
                      'jacket',
                      event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                    )
                  }
                  class="w-full rounded border border-border-strong px-3 py-2"
                />
              </label>
            </div>
          </div>

          <div class="overflow-x-auto rounded border border-border">
            <table class="min-w-full text-sm">
              <thead class="bg-surface-muted">
                <tr>
                  <th class="whitespace-nowrap px-3 py-2 text-left">追加</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">難易度</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">定数</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">未確定</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">ノーツ</th>
                  <th class="whitespace-nowrap px-3 py-2 text-left">NOTES DESIGNER</th>
                </tr>
              </thead>
              <tbody>
                <Index each={createSongDraft().charts}>
                  {(chart, chartIndex) => (
                    <tr class="border-t border-border">
                      <td class="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={chart().enabled}
                          onChange={(event) =>
                            updateCreateSongChart(
                              chartIndex,
                              'enabled',
                              event.currentTarget.checked
                            )
                          }
                        />
                      </td>
                      <td class="px-3 py-2">{chart().difficulty_name}</td>
                      <td class="px-3 py-2">
                        <input
                          type="text"
                          inputmode="decimal"
                          value={chart().const}
                          onInput={(event) =>
                            updateCreateSongChart(chartIndex, 'const', event.currentTarget.value)
                          }
                          class="w-20 rounded border border-border-strong px-2 py-1"
                          disabled={!chart().enabled}
                        />
                      </td>
                      <td class="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={chart().is_const_unknown}
                          onChange={(event) =>
                            updateCreateSongChart(
                              chartIndex,
                              'is_const_unknown',
                              event.currentTarget.checked
                            )
                          }
                          disabled={!chart().enabled}
                        />
                      </td>
                      <td class="px-3 py-2">
                        <input
                          type="number"
                          value={chart().notes ?? ''}
                          onInput={(event) =>
                            updateCreateSongChart(
                              chartIndex,
                              'notes',
                              event.currentTarget.value === ''
                                ? null
                                : Number(event.currentTarget.value)
                            )
                          }
                          class="w-24 rounded border border-border-strong px-2 py-1"
                          disabled={!chart().enabled}
                        />
                      </td>
                      <td class="px-3 py-2">
                        <input
                          value={chart().notes_designer ?? ''}
                          onInput={(event) =>
                            updateCreateSongChart(
                              chartIndex,
                              'notes_designer',
                              event.currentTarget.value.trim() === ''
                                ? null
                                : event.currentTarget.value
                            )
                          }
                          class="w-56 rounded border border-border-strong px-2 py-1 font-sans"
                          disabled={!chart().enabled}
                        />
                      </td>
                    </tr>
                  )}
                </Index>
              </tbody>
            </table>
          </div>

          <button
            type="button"
            class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-text-inverse hover:bg-indigo-700"
            onClick={handleCreateSong}
          >
            通常楽曲を追加する
          </button>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4">
        <h2 class="text-lg font-semibold">WORLD&apos;S END楽曲を追加</h2>
        <div class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">公式ID</span>
            <input
              value={createWorldsendDraft().official_idx}
              maxLength={10}
              onInput={(event) =>
                updateCreateWorldsendDraftField('official_idx', event.currentTarget.value)
              }
              class="w-full rounded border border-border-strong px-3 py-2"
              placeholder="1234567890"
            />
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">タイトル</span>
            <input
              value={createWorldsendDraft().title}
              onInput={(event) =>
                updateCreateWorldsendDraftField('title', event.currentTarget.value)
              }
              class="w-full rounded border border-border-strong px-3 py-2 font-sans"
            />
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">読み</span>
            <input
              value={createWorldsendDraft().reading ?? ''}
              maxLength={300}
              onInput={(event) =>
                updateCreateWorldsendDraftField(
                  'reading',
                  event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                )
              }
              class="w-full rounded border border-border-strong px-3 py-2 font-sans"
            />
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">アーティスト</span>
            <input
              value={createWorldsendDraft().artist}
              onInput={(event) =>
                updateCreateWorldsendDraftField('artist', event.currentTarget.value)
              }
              class="w-full rounded border border-border-strong px-3 py-2 font-sans"
            />
          </label>
          <div class="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-3 lg:grid-cols-4">
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">ジャンル</span>
              <select
                value={String(createWorldsendDraft().genre_id ?? '')}
                onChange={(event) =>
                  updateCreateWorldsendDraftField(
                    'genre_id',
                    event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
                  )
                }
                class="w-full rounded border border-border-strong px-3 py-2"
              >
                <option value="">選択してください</option>
                <For each={masterData()?.genres ?? []}>
                  {(genre) => <option value={genre.id}>{genre.name}</option>}
                </For>
              </select>
            </label>
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">BPM</span>
              <input
                type="number"
                value={createWorldsendDraft().bpm ?? ''}
                onInput={(event) =>
                  updateCreateWorldsendDraftField(
                    'bpm',
                    event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
                  )
                }
                class="w-full rounded border border-border-strong px-3 py-2"
              />
            </label>
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">リリース日</span>
              <input
                type="date"
                value={toDateInputValue(createWorldsendDraft().released_at)}
                onInput={(event) =>
                  updateCreateWorldsendDraftField(
                    'released_at',
                    event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                  )
                }
                class="w-full rounded border border-border-strong px-3 py-2"
              />
            </label>
            <label class="text-sm">
              <span class="mb-1 block text-text-muted">ジャケットID</span>
              <input
                value={createWorldsendDraft().jacket ?? ''}
                onInput={(event) =>
                  updateCreateWorldsendDraftField(
                    'jacket',
                    event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                  )
                }
                class="w-full rounded border border-border-strong px-3 py-2"
              />
            </label>
          </div>
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">属性</span>
            <input
              value={createWorldsendDraft().attribute ?? ''}
              onInput={(event) =>
                updateCreateWorldsendDraftField(
                  'attribute',
                  event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                )
              }
              class="w-full rounded border border-border-strong px-3 py-2"
            />
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">レベル</span>
            <input
              type="number"
              min="1"
              max="5"
              value={createWorldsendDraft().level_star ?? ''}
              onInput={(event) =>
                updateCreateWorldsendDraftField(
                  'level_star',
                  event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
                )
              }
              class="w-full rounded border border-border-strong px-3 py-2"
            />
          </label>
          <label class="text-sm">
            <span class="mb-1 block text-text-muted">ノーツ</span>
            <input
              type="number"
              min="0"
              value={createWorldsendDraft().notes ?? ''}
              onInput={(event) =>
                updateCreateWorldsendDraftField(
                  'notes',
                  event.currentTarget.value === '' ? null : Number(event.currentTarget.value)
                )
              }
              class="w-full rounded border border-border-strong px-3 py-2"
            />
          </label>
          <label class="text-sm sm:col-span-2 lg:col-span-1">
            <span class="mb-1 block text-text-muted">NOTES DESIGNER</span>
            <input
              value={createWorldsendDraft().notes_designer ?? ''}
              onInput={(event) =>
                updateCreateWorldsendDraftField(
                  'notes_designer',
                  event.currentTarget.value.trim() === '' ? null : event.currentTarget.value
                )
              }
              class="w-full rounded border border-border-strong px-3 py-2 font-sans"
            />
          </label>
        </div>

        <button
          type="button"
          class="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-text-inverse hover:bg-indigo-700"
          onClick={handleCreateWorldsendSong}
        >
          WORLD&apos;S END楽曲を追加する
        </button>
      </section>
    </div>
  )
}

export default SongManagementPage
