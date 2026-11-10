import { Dialog } from '@kobalte/core/dialog'
import { createMemo, createResource, createSignal, For, onCleanup, Show } from 'solid-js'
import {
  addMyLockedSong,
  deleteMyLockedSong,
  fetchUserLockedSongs,
  fetchUserProfileSummary,
} from '../../api/users'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { LockedSongsOpComparison } from '../../components/common/LockedSongsOpComparison'
import { LockedSongToggle } from '../../components/common/LockedSongToggle'
import { RecordDifficultyBadge } from '../../components/common/record/RecordBadges'
import { RecordLampDots } from '../../components/common/record/RecordDisplayParts'
import Loading from '../../components/Loading/Loading'
import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import {
  createLockedSongKey,
  toLockedSongRequests,
} from '../../usecases/overpower/lockedSongsBatch'
import { buildLockedSongsOpComparison } from '../../usecases/overpower/lockedSongsOpComparison'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import type { LockedSongDiscoveryCandidate } from '../../utils/lockedSongDiscovery'
import { formatInteger, formatTruncatedFixed } from '../../utils/numberFormat'
import {
  LOCKED_SONG_CANDIDATES_COPY as COPY,
  LOCKED_SONG_DISCOVERY_COPY,
} from './lockedSongDiscovery.constants'

/**
 * 通常楽曲とULTIMAの候補を、OP対象レコード付きの横長の選択行で表示する。
 *
 * @param props - ログインユーザー、候補曲、全楽曲・全レコード・バージョン、開閉処理。
 * @returns 本文だけをスクロールする候補楽曲ダイアログ。
 */
export const LockedSongCandidatesDialog = (props: {
  username: string
  candidates: LockedSongDiscoveryCandidate[]
  songs: SongDTO[]
  records: PlayerRecordDTO[]
  recordsComplete: boolean
  versions: VersionSummaryDTO[]
  onClose: () => void
}) => {
  const candidateSongCount = createMemo(
    () => new Set(props.candidates.map((candidate) => candidate.song.id)).size
  )
  const [lockedKeys, { mutate, refetch }] = createResource(
    () => props.username,
    async (username) => {
      const response = await fetchUserLockedSongs(username)
      return new Set(response.items.map((item) => createLockedSongKey(item.id, item.is_ultima)))
    }
  )
  const [profile, { refetch: refetchProfile }] = createResource(
    () => props.username,
    fetchUserProfileSummary
  )
  const opComparison = createMemo(() => {
    if (!props.recordsComplete || profile.error || lockedKeys.error) return undefined
    const player = profile()?.player
    const keys = lockedKeys()
    if (!player || !keys) return undefined
    return buildLockedSongsOpComparison({
      songs: props.songs,
      records: props.records,
      versions: props.versions,
      lockedSongs: toLockedSongRequests([...keys]),
      officialOverPower: player.official_overpower,
      officialOverPowerPercent: player.official_overpower_percent,
    })
  })
  const [savingKey, setSavingKey] = createSignal<string>()
  const [saveError, setSaveError] = createSignal<{ key: string; message: string }>()
  let active = true
  onCleanup(() => {
    active = false
  })

  /**
   * 1件の未解禁状態を保存し、成功時だけ一覧の状態を更新する。
   *
   * @param candidate - 更新する候補曲。
   * @returns 保存処理の完了を表すPromise。
   */
  const toggleLocked = async (candidate: LockedSongDiscoveryCandidate): Promise<void> => {
    const current = lockedKeys()
    if (!current || lockedKeys.loading || lockedKeys.error || savingKey()) return
    const username = props.username
    const key = createLockedSongKey(candidate.song.id, candidate.isUltima)
    const locked = current.has(key)
    setSavingKey(key)
    setSaveError(undefined)
    try {
      const request = { id: candidate.song.id, is_ultima: candidate.isUltima }
      if (locked) await deleteMyLockedSong(request)
      else await addMyLockedSong(request)
      if (active && username === props.username) {
        mutate((previous) => {
          const next = new Set(previous)
          if (locked) next.delete(key)
          else next.add(key)
          return next
        })
      }
    } catch (error) {
      if (active && username === props.username) {
        setSaveError({
          key,
          message: toUserFriendlyErrorMessage(error, COPY.saveError),
        })
      }
    } finally {
      if (active) setSavingKey(undefined)
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !savingKey() && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex h-[calc(100dvh-2rem)] flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[90dvh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div class="mb-4 shrink-0 font-sans">
            <Dialog.Title class="text-lg font-bold">{COPY.title}</Dialog.Title>
            <Dialog.Description class="sr-only">{COPY.description}</Dialog.Description>
            <p class="mt-1 text-sm text-text-muted">
              {candidateSongCount()}
              {COPY.songCountUnit}
            </p>
            <Show when={!props.recordsComplete}>
              <p class="mt-2 text-sm text-danger" role="alert">
                {LOCKED_SONG_DISCOVERY_COPY.recordIncomplete}
              </p>
            </Show>
            <Show when={profile.loading}>
              <div class="flex justify-center py-2">
                <Loading size="inline" />
              </div>
            </Show>
            <Show when={profile.error}>
              <div class="mt-2 space-y-2">
                <p class="text-sm text-danger" role="alert">
                  {toUserFriendlyErrorMessage(profile.error, COPY.comparisonLoadError)}
                </p>
                <AppButton onClick={() => void refetchProfile()}>{COPY.retry}</AppButton>
              </div>
            </Show>
            <Show when={opComparison()}>
              {(comparison) => (
                <LockedSongsOpComparison comparison={comparison} showGuidance={false} />
              )}
            </Show>
          </div>
          <div class="min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain rounded border border-border bg-surface">
            <Show
              when={!lockedKeys.loading}
              fallback={
                <div class="flex justify-center p-8">
                  <Loading />
                </div>
              }
            >
              <Show
                when={!lockedKeys.error}
                fallback={
                  <div class="space-y-3 p-4">
                    <p class="font-sans text-sm text-danger" role="alert">
                      {toUserFriendlyErrorMessage(lockedKeys.error, COPY.loadError)}
                    </p>
                    <AppButton class="focus-visible:ring-inset" onClick={() => void refetch()}>
                      {COPY.retry}
                    </AppButton>
                  </div>
                }
              >
                <ul class="divide-y divide-border">
                  <For
                    each={props.candidates}
                    fallback={<li class="p-4 font-sans text-sm text-text-muted">{COPY.empty}</li>}
                  >
                    {(candidate) => {
                      const key = createLockedSongKey(candidate.song.id, candidate.isUltima)
                      const error = () =>
                        saveError()?.key === key ? saveError()?.message : undefined
                      const opRecord = createMemo(() => candidate.opTarget?.record ?? undefined)
                      return (
                        <li>
                          <LockedSongToggle
                            songTitle={candidate.song.title}
                            isUltima={candidate.isUltima}
                            locked={lockedKeys()?.has(key) ?? false}
                            disabled={
                              Boolean(savingKey()) ||
                              lockedKeys.loading ||
                              Boolean(lockedKeys.error)
                            }
                            busy={savingKey() === key}
                            onClick={() => void toggleLocked(candidate)}
                          >
                            <span class="min-w-0 flex-1">
                              <span class="flex min-w-0 items-center gap-1.5">
                                <span
                                  class="truncate text-sm font-medium"
                                  title={candidate.song.title}
                                >
                                  {candidate.song.title}
                                </span>
                                <Show when={candidate.isUltima}>
                                  <span class="shrink-0 rounded bg-danger-bg px-1 py-0.5 font-oswald text-xs text-danger">
                                    {COPY.ultima}
                                  </span>
                                </Show>
                              </span>
                              <span class="block truncate text-xs opacity-70">
                                {candidate.song.artist}
                              </span>
                            </span>
                            <Show
                              when={opRecord()}
                              fallback={
                                <span class="shrink-0 text-xs opacity-70">{COPY.unplayed}</span>
                              }
                            >
                              {(record) => (
                                <div class="shrink-0 space-y-1">
                                  <div class="flex items-center justify-end gap-1.5">
                                    <RecordDifficultyBadge difficulty={record().difficulty} />
                                    <span class="whitespace-nowrap font-oswald text-sm">
                                      <span class="sr-only">
                                        {!candidate.isUltima && COPY.opTarget} {COPY.score}{' '}
                                      </span>
                                      {formatInteger(record().score)}
                                    </span>
                                    <RecordLampDots record={record()} />
                                  </div>
                                  <span class="flex items-baseline justify-end gap-1 whitespace-nowrap text-xs">
                                    <span class="opacity-70">{COPY.op}</span>
                                    <span class="font-oswald">
                                      {formatTruncatedFixed(record().overpower, 2)}
                                    </span>
                                    <span class="opacity-70" aria-hidden="true">
                                      /
                                    </span>
                                    <span class="sr-only">{COPY.percent} </span>
                                    <span class="font-oswald">
                                      {formatTruncatedFixed(record().overpower_percent, 2)}%
                                    </span>
                                  </span>
                                </div>
                              )}
                            </Show>
                          </LockedSongToggle>
                          <Show when={error()}>
                            {(message) => (
                              <p class="px-3 pb-2 font-sans text-sm text-danger" role="alert">
                                {message()}
                              </p>
                            )}
                          </Show>
                        </li>
                      )
                    }}
                  </For>
                </ul>
              </Show>
            </Show>
          </div>
          <div class="mt-4 flex shrink-0 justify-end">
            <Dialog.CloseButton disabled={Boolean(savingKey())} class={getAppButtonClass({})}>
              {COPY.close}
            </Dialog.CloseButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
