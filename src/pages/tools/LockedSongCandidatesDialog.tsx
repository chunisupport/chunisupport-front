import { Dialog } from '@kobalte/core/dialog'
import { createMemo, createResource, createSignal, For, onCleanup, Show } from 'solid-js'
import { addMyLockedSong, deleteMyLockedSong, fetchUserLockedSongs } from '../../api/users'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import { LockedSongToggle } from '../../components/common/LockedSongToggle'
import { DefaultRecordLampBadges } from '../../components/common/record/RecordDisplayParts'
import Loading from '../../components/Loading/Loading'
import { createLockedSongKey } from '../../usecases/overpower/lockedSongsBatch'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import type { LockedSongDiscoveryCandidate } from '../../utils/lockedSongDiscovery'
import { formatInteger, formatTruncatedFixed } from '../../utils/numberFormat'
import { LOCKED_SONG_CANDIDATES_COPY as COPY } from './lockedSongDiscovery.constants'

/**
 * 候補曲のOP対象レコードと、即時保存する未解禁ボタンを表示する。
 *
 * @param props - ログインユーザー、候補曲、ダイアログの開閉処理。
 * @returns 本文だけをスクロールする候補楽曲ダイアログ。
 */
export const LockedSongCandidatesDialog = (props: {
  username: string
  candidates: LockedSongDiscoveryCandidate[]
  onClose: () => void
}) => {
  const [lockedKeys, { mutate, refetch }] = createResource(
    () => props.username,
    async (username) => {
      const response = await fetchUserLockedSongs(username)
      return new Set(response.items.map((item) => createLockedSongKey(item.id, item.is_ultima)))
    }
  )
  const [savingKey, setSavingKey] = createSignal<string>()
  const [saveError, setSaveError] = createSignal<{ songId: string; message: string }>()
  let active = true
  onCleanup(() => {
    active = false
  })

  /**
   * 1件の未解禁状態を保存し、成功時だけ一覧の状態を更新する。
   *
   * @param candidate - 更新する候補曲。
   * @param isUltima - ULTIMAのみを対象とする場合はtrue。
   * @returns 保存処理の完了を表すPromise。
   */
  const toggleLocked = async (
    candidate: LockedSongDiscoveryCandidate,
    isUltima: boolean
  ): Promise<void> => {
    const current = lockedKeys()
    if (!current || lockedKeys.loading || lockedKeys.error || savingKey()) return
    const username = props.username
    const key = createLockedSongKey(candidate.song.id, isUltima)
    const locked = current.has(key)
    setSavingKey(key)
    setSaveError(undefined)
    try {
      const request = { id: candidate.song.id, is_ultima: isUltima }
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
          songId: candidate.song.id,
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
              {props.candidates.length}
              {COPY.songCountUnit}
            </p>
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
                      const error = () =>
                        saveError()?.songId === candidate.song.id ? saveError()?.message : undefined
                      const opRecord = createMemo(() => candidate.opTarget?.record ?? undefined)
                      return (
                        <li class="space-y-3 p-3 sm:p-4">
                          <div class="min-w-0 font-sans">
                            <p class="break-words text-sm font-semibold text-text">
                              {candidate.song.title}
                            </p>
                            <p class="truncate text-xs text-text-muted">{candidate.song.artist}</p>
                          </div>
                          <Show
                            when={opRecord()}
                            fallback={
                              <p class="font-sans text-sm text-text-subtle">{COPY.unplayed}</p>
                            }
                          >
                            {(record) => (
                              <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span class="font-sans text-xs text-text-muted">
                                  {COPY.opTarget}
                                </span>
                                <DifficultyBadge difficulty={record().difficulty} compact />
                                <span class="font-oswald text-lg text-text">
                                  <span class="sr-only">{COPY.score} </span>
                                  {formatInteger(record().score)}
                                </span>
                                <DefaultRecordLampBadges record={record()} />
                                <dl class="flex w-full flex-wrap gap-x-4 gap-y-1 text-sm">
                                  <div class="flex items-baseline gap-1">
                                    <dt class="font-sans text-xs text-text-muted">{COPY.op}</dt>
                                    <dd class="font-oswald text-text">
                                      {formatTruncatedFixed(record().overpower, 2)}
                                    </dd>
                                  </div>
                                  <div class="flex items-baseline gap-1">
                                    <dt class="font-sans text-xs text-text-muted">
                                      {COPY.percent}
                                    </dt>
                                    <dd class="font-oswald text-text">
                                      {formatTruncatedFixed(record().overpower_percent, 2)}%
                                    </dd>
                                  </div>
                                </dl>
                              </div>
                            )}
                          </Show>
                          <fieldset class="flex flex-wrap gap-2">
                            <legend class="sr-only">{candidate.song.title}</legend>
                            <For each={candidate.song.charts.ULTIMA ? [false, true] : [false]}>
                              {(isUltima) => {
                                const key = createLockedSongKey(candidate.song.id, isUltima)
                                return (
                                  <LockedSongToggle
                                    isUltima={isUltima}
                                    locked={lockedKeys()?.has(key) ?? false}
                                    disabled={
                                      Boolean(savingKey()) ||
                                      lockedKeys.loading ||
                                      Boolean(lockedKeys.error)
                                    }
                                    busy={savingKey() === key}
                                    onClick={() => void toggleLocked(candidate, isUltima)}
                                  />
                                )
                              }}
                            </For>
                          </fieldset>
                          <Show when={error()}>
                            {(message) => (
                              <p class="font-sans text-sm text-danger" role="alert">
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
