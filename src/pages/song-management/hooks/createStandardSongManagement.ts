import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, untrack } from 'solid-js'
import {
  createSong,
  deleteSongByDisplayId,
  fetchManagedSongs,
  restoreSongByDisplayId,
  updateSongs,
} from '../../../api/songs'
import { showErrorToast, showSuccessToast } from '../../../components/common/AppToast'
import { normalizePlayerDataDifficulty } from '../../../constants/difficulty'
import { SONG_DATA_REFRESH_ERROR_MESSAGE } from '../../../constants/songMaster'
import { useSongsData } from '../../../stores/songsData'
import type { ManagedSongDTO, MasterDataDTO } from '../../../types/api'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { buildSearchableItems, filterSearchableItems } from '../../../utils/searchHelpers'
import { SONG_MANAGEMENT_MESSAGES } from '../constants'
import { createSongManagementFilters, filterManagedSongs } from '../songManagementFilters'
import { patchManagedSongResponse } from '../utils/patchManagedSongResponse'
import { sortByReleaseDateDescWithMissingFirst } from '../utils/releaseDateSorting'
import {
  addUltimaChartToDraft,
  applySongDraftToManagedSong,
  buildCreateSongDraft,
  buildCreateSongRequest,
  buildUpdateSongRequest,
  type CreateSongChartDraftField,
  type CreateSongDraft,
  type EditableChartDraftField,
  hasSongDraftChanges,
  type SongDraft,
  toSongDraft,
} from '../utils/standardSongDraft'

/**
 * 楽曲管理画面の通常楽曲について、一覧・選択・編集・追加・削除・復活の状態と操作をまとめる。
 * 管理一覧の再取得は resource.refetch を使わず mutate で差し替え、画面の再マウントを避ける。
 *
 * @param masterData ジャンル・難易度・バージョンを含むマスターデータ
 * @returns 通常楽曲管理の状態と操作
 */
export const createStandardSongManagement = (masterData: Accessor<MasterDataDTO | undefined>) => {
  const songsData = useSongsData()
  const [songsResponse, { mutate: mutateManagedSongs }] = createResource(fetchManagedSongs)

  const [selectedSongId, setSelectedSongId] = createSignal<string>('')
  const [draft, setDraft] = createSignal<SongDraft | null>(null)
  const [initialDraft, setInitialDraft] = createSignal<SongDraft | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [createDraft, setCreateDraft] = createSignal<CreateSongDraft>(buildCreateSongDraft())
  const [searchQuery, setSearchQuery] = createSignal('')
  const [filters, setFilters] = createSignal(createSongManagementFilters())

  const songs = createMemo<ManagedSongDTO[]>(() =>
    sortByReleaseDateDescWithMissingFirst(songsResponse.latest?.songs ?? [])
  )
  const searchableSongs = createMemo(() => buildSearchableItems(songs()))
  const filteredSongs = createMemo(() =>
    filterManagedSongs(
      filterSearchableItems(searchableSongs(), searchQuery()),
      filters(),
      masterData()?.versions ?? []
    )
  )
  const selectedSong = createMemo(() => {
    const selected = selectedSongId()
    if (!selected) return null
    return songs().find((item) => item.id === selected) ?? null
  })
  const changed = createMemo(() => hasSongDraftChanges(draft(), initialDraft()))

  createEffect(() => {
    const selectedId = selectedSongId()
    const md = masterData()
    if (!selectedId || !md) {
      setDraft(null)
      setInitialDraft(null)
      return
    }

    const song = untrack(() => songs().find((item) => item.id === selectedId) ?? null)
    if (!song) {
      setDraft(null)
      setInitialDraft(null)
      return
    }

    const nextDraft = toSongDraft(song, md.genres, md.difficulties)
    setInitialDraft(nextDraft)
    setDraft(nextDraft)
  })

  /**
   * 編集ドラフトの楽曲項目を更新する。
   *
   * @param key 更新する項目
   * @param value 新しい値
   * @returns なし
   */
  const updateDraftField = <K extends keyof SongDraft>(key: K, value: SongDraft[K]): void => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  /**
   * 編集ドラフトの指定難易度の譜面項目を更新する。
   *
   * @param difficultyId 更新する譜面の難易度マスタID
   * @param key 更新する項目
   * @param value 新しい値
   * @returns なし
   */
  const updateDraftChart = (
    difficultyId: number,
    key: EditableChartDraftField,
    value: number | boolean | string | null
  ): void => {
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

  /**
   * 選択中の通常楽曲ドラフトへ ULTIMA 譜面の入力行を追加する。
   *
   * @returns なし
   */
  const addUltimaChart = (): void => {
    const md = masterData()
    if (!md) {
      showErrorToast(SONG_MANAGEMENT_MESSAGES.masterDataMissingForUltima)
      return
    }

    const ultimaDifficulty = md.difficulties.find(
      (difficulty) => normalizePlayerDataDifficulty(difficulty.name) === 'ULTIMA'
    )
    if (!ultimaDifficulty) {
      showErrorToast(SONG_MANAGEMENT_MESSAGES.ultimaDifficultyMissing)
      return
    }

    setDraft((prev) => (prev ? addUltimaChartToDraft(prev, ultimaDifficulty.id) : prev))
  }

  /**
   * 追加フォームの楽曲項目を更新する。
   *
   * @param key 更新する項目
   * @param value 新しい値
   * @returns なし
   */
  const updateCreateDraftField = <K extends keyof CreateSongDraft>(
    key: K,
    value: CreateSongDraft[K]
  ): void => {
    setCreateDraft((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * 追加フォームの指定行の譜面項目を更新する。
   *
   * @param chartIndex 更新する譜面行の位置
   * @param key 更新する項目
   * @param value 新しい値
   * @returns なし
   */
  const updateCreateChart = (
    chartIndex: number,
    key: CreateSongChartDraftField,
    value: boolean | number | string | null
  ): void => {
    setCreateDraft((prev) => ({
      ...prev,
      charts: prev.charts.map((chart, index) =>
        index === chartIndex ? { ...chart, [key]: value } : chart
      ),
    }))
  }

  /**
   * 通常楽曲の公開キャッシュを無効化する。管理一覧は再取得せず、画面の再マウントを避ける。
   *
   * @returns なし。
   */
  const invalidatePublicSongs = (): void => {
    void songsData.refreshSongs().catch((error: unknown) => {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_DATA_REFRESH_ERROR_MESSAGE))
    })
  }

  /**
   * 通常楽曲追加後に管理一覧を差し替え、公開キャッシュを無効化する。
   * resource.refetch は loading で画面をアンマウントするため使わない。
   *
   * @returns 再取得処理完了後に解決される Promise。
   */
  const refreshSongData = async (): Promise<void> => {
    try {
      mutateManagedSongs(await fetchManagedSongs())
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_DATA_REFRESH_ERROR_MESSAGE))
      return
    }

    invalidatePublicSongs()
  }

  /**
   * 編集中の通常楽曲を検証して保存する。保存中の二重送信は無視する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const save = async (): Promise<void> => {
    const current = draft()
    if (!current || !changed() || saving()) return

    const md = masterData()
    if (!md) {
      showErrorToast(SONG_MANAGEMENT_MESSAGES.masterDataMissingForUpdate)
      return
    }

    const result = buildUpdateSongRequest(current, md.genres)
    if (!result.ok) {
      showErrorToast(result.message)
      return
    }
    const { request } = result

    setSaving(true)
    try {
      await updateSongs([request])
      mutateManagedSongs((response) =>
        patchManagedSongResponse(response, current.id, (song) =>
          applySongDraftToManagedSong(song, current, request.genre)
        )
      )
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.standardUpdated)
      if (selectedSongId() === current.id) setInitialDraft(current)
      invalidatePublicSongs()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.updateError))
    } finally {
      setSaving(false)
    }
  }

  /**
   * 入力中の通常楽曲を検証して追加する。
   *
   * @returns 処理完了後に解決されるPromise。
   */
  const create = async (): Promise<void> => {
    const current = createDraft()

    const md = masterData()
    if (!md) {
      showErrorToast(SONG_MANAGEMENT_MESSAGES.masterDataMissingForCreate)
      return
    }

    const result = buildCreateSongRequest(current, md.genres)
    if (!result.ok) {
      showErrorToast(result.message)
      return
    }

    try {
      await createSong(result.request)
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.standardCreated)
      setCreateDraft(buildCreateSongDraft())
      await refreshSongData()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.createError))
    }
  }

  /**
   * 指定された通常楽曲を確認後に削除する。
   *
   * @param displayId - 削除対象の楽曲表示ID。
   * @returns 処理完了後に解決されるPromise。
   */
  const remove = async (displayId: string): Promise<void> => {
    if (!window.confirm(SONG_MANAGEMENT_MESSAGES.standardDeleteConfirm)) return
    try {
      await deleteSongByDisplayId(displayId)
      mutateManagedSongs((current) =>
        patchManagedSongResponse(current, displayId, (song) => ({ ...song, is_deleted: true }))
      )
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.standardDeleted)
      invalidatePublicSongs()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.deleteError))
    }
  }

  /**
   * 指定された通常楽曲を復活する。
   *
   * @param displayId - 復活対象の楽曲表示ID。
   * @returns 処理完了後に解決されるPromise。
   */
  const restore = async (displayId: string): Promise<void> => {
    try {
      await restoreSongByDisplayId(displayId)
      mutateManagedSongs((current) =>
        patchManagedSongResponse(current, displayId, (song) => ({ ...song, is_deleted: false }))
      )
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.standardRestored)
      invalidatePublicSongs()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.restoreError))
    }
  }

  return {
    songs,
    /** 管理一覧の取得中か。WORLD'S END の取り込みボタン制御に使う */
    songsLoading: () => songsResponse.loading,
    filteredSongs,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    selectedSongId,
    selectSong: setSelectedSongId,
    selectedSong,
    draft,
    changed,
    saving,
    updateDraftField,
    updateDraftChart,
    addUltimaChart,
    save,
    remove,
    restore,
    createDraft,
    updateCreateDraftField,
    updateCreateChart,
    create,
  }
}

/** 通常楽曲管理の状態と操作 */
export type StandardSongManagement = ReturnType<typeof createStandardSongManagement>
