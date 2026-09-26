import type { Accessor } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, untrack } from 'solid-js'
import {
  createWorldsendSong,
  deleteWorldsendSongByDisplayId,
  fetchManagedWorldsendSongs,
  restoreWorldsendSongByDisplayId,
  updateWorldsendSongs,
} from '../../../api/songs'
import { showErrorToast, showSuccessToast } from '../../../components/common/AppToast'
import { SONG_DATA_REFRESH_ERROR_MESSAGE } from '../../../constants/songMaster'
import { useSongsData } from '../../../stores/songsData'
import type { ManagedWorldsendSongDTO, MasterDataDTO } from '../../../types/api'
import { toUserFriendlyErrorMessage } from '../../../utils/errorMessage'
import { buildSearchableItems, filterSearchableItems } from '../../../utils/searchHelpers'
import { SONG_MANAGEMENT_MESSAGES } from '../constants'
import { createSongManagementFilters, filterManagedWorldsendSongs } from '../songManagementFilters'
import { patchManagedSongResponse } from '../utils/patchManagedSongResponse'
import { sortByReleaseDateDescWithMissingFirst } from '../utils/releaseDateSorting'
import {
  applyWorldsendDraftToManagedSong,
  buildCreateWorldsendDraft,
  buildCreateWorldsendSongRequest,
  buildUpdateWorldsendSongRequest,
  type CreateWorldsendDraft,
  hasWorldsendDraftChanges,
  toWorldsendDraft,
  type WorldsendDraft,
} from '../utils/worldsendSongDraft'

/**
 * 楽曲管理画面の WORLD'S END 楽曲について、一覧・選択・編集・追加・削除・復活の状態と操作をまとめる。
 * 管理一覧の再取得は resource.refetch を使わず mutate で差し替え、画面の再マウントを避ける。
 *
 * @param masterData ジャンル・バージョンを含むマスターデータ
 * @returns WORLD'S END 楽曲管理の状態と操作
 */
export const createWorldsendSongManagement = (masterData: Accessor<MasterDataDTO | undefined>) => {
  const songsData = useSongsData()
  const [songsResponse, { mutate: mutateManagedSongs }] = createResource(fetchManagedWorldsendSongs)

  const [selectedSongId, setSelectedSongId] = createSignal<string>('')
  const [draft, setDraft] = createSignal<WorldsendDraft | null>(null)
  const [initialDraft, setInitialDraft] = createSignal<WorldsendDraft | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [createDraft, setCreateDraft] = createSignal<CreateWorldsendDraft>(
    buildCreateWorldsendDraft()
  )
  const [searchQuery, setSearchQuery] = createSignal('')
  const [filters, setFilters] = createSignal(createSongManagementFilters())

  const songs = createMemo<ManagedWorldsendSongDTO[]>(() =>
    sortByReleaseDateDescWithMissingFirst(songsResponse.latest?.songs ?? [])
  )
  const searchableSongs = createMemo(() => buildSearchableItems(songs()))
  const filteredSongs = createMemo(() =>
    filterManagedWorldsendSongs(
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
  const changed = createMemo(() => hasWorldsendDraftChanges(draft(), initialDraft()))

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

    const nextDraft = toWorldsendDraft(song, md.genres)
    setInitialDraft(nextDraft)
    setDraft(nextDraft)
  })

  /**
   * 編集ドラフトの楽曲・譜面項目を更新する。
   *
   * @param key 更新する項目
   * @param value 新しい値
   * @returns なし
   */
  const updateDraftField = <K extends keyof WorldsendDraft>(
    key: K,
    value: WorldsendDraft[K]
  ): void => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  /**
   * 追加フォームの楽曲・譜面項目を更新する。
   *
   * @param key 更新する項目
   * @param value 新しい値
   * @returns なし
   */
  const updateCreateDraftField = <K extends keyof CreateWorldsendDraft>(
    key: K,
    value: CreateWorldsendDraft[K]
  ): void => {
    setCreateDraft((prev) => ({ ...prev, [key]: value }))
  }

  /**
   * WORLD'S END 楽曲の公開キャッシュを無効化する。管理一覧は再取得せず、画面の再マウントを避ける。
   *
   * @returns なし。
   */
  const invalidatePublicSongs = (): void => {
    void songsData.refreshWorldsendSongs().catch((error: unknown) => {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_DATA_REFRESH_ERROR_MESSAGE))
    })
  }

  /**
   * WORLD'S END 楽曲追加後に管理一覧を差し替え、公開キャッシュを無効化する。
   * resource.refetch は loading で画面をアンマウントするため使わない。
   *
   * @returns 再取得処理完了後に解決される Promise。
   */
  const refreshSongData = async (): Promise<void> => {
    try {
      mutateManagedSongs(await fetchManagedWorldsendSongs())
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_DATA_REFRESH_ERROR_MESSAGE))
      return
    }

    invalidatePublicSongs()
  }

  /**
   * 編集中のWORLD'S END楽曲を検証して保存する。保存中の二重送信は無視する。
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

    const result = buildUpdateWorldsendSongRequest(current, md.genres)
    if (!result.ok) {
      showErrorToast(result.message)
      return
    }
    const { request } = result

    setSaving(true)
    try {
      await updateWorldsendSongs([request])
      mutateManagedSongs((response) =>
        patchManagedSongResponse(response, current.id, (song) =>
          applyWorldsendDraftToManagedSong(song, current, request.genre)
        )
      )
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.worldsendUpdated)
      if (selectedSongId() === current.id) setInitialDraft(current)
      invalidatePublicSongs()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.updateError))
    } finally {
      setSaving(false)
    }
  }

  /**
   * 入力中のWORLD'S END楽曲を検証して追加する。
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

    const result = buildCreateWorldsendSongRequest(current, md.genres)
    if (!result.ok) {
      showErrorToast(result.message)
      return
    }

    try {
      await createWorldsendSong(result.request)
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.worldsendCreated)
      setCreateDraft(buildCreateWorldsendDraft())
      await refreshSongData()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.createError))
    }
  }

  /**
   * 指定されたWORLD'S END楽曲を確認後に削除する。
   *
   * @param displayId - 削除対象の楽曲表示ID。
   * @returns 処理完了後に解決されるPromise。
   */
  const remove = async (displayId: string): Promise<void> => {
    if (!window.confirm(SONG_MANAGEMENT_MESSAGES.worldsendDeleteConfirm)) return
    try {
      await deleteWorldsendSongByDisplayId(displayId)
      mutateManagedSongs((current) =>
        patchManagedSongResponse(current, displayId, (song) => ({ ...song, is_deleted: true }))
      )
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.worldsendDeleted)
      invalidatePublicSongs()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.deleteError))
    }
  }

  /**
   * 指定されたWORLD'S END楽曲を復活する。
   *
   * @param displayId - 復活対象の楽曲表示ID。
   * @returns 処理完了後に解決されるPromise。
   */
  const restore = async (displayId: string): Promise<void> => {
    try {
      await restoreWorldsendSongByDisplayId(displayId)
      mutateManagedSongs((current) =>
        patchManagedSongResponse(current, displayId, (song) => ({ ...song, is_deleted: false }))
      )
      showSuccessToast(SONG_MANAGEMENT_MESSAGES.worldsendRestored)
      invalidatePublicSongs()
    } catch (error) {
      showErrorToast(toUserFriendlyErrorMessage(error, SONG_MANAGEMENT_MESSAGES.restoreError))
    }
  }

  return {
    songs,
    /** 管理一覧を一度でも取得済みか。未取得の間は空表示を出さない */
    loaded: () => songsResponse.latest !== undefined,
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
    save,
    remove,
    restore,
    createDraft,
    updateCreateDraftField,
    create,
  }
}

/** WORLD'S END 楽曲管理の状態と操作 */
export type WorldsendSongManagement = ReturnType<typeof createWorldsendSongManagement>
