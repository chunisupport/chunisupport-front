import { Dialog } from '@kobalte/core/dialog'
import { RadioGroup } from '@kobalte/core/radio-group'
import { Target } from 'lucide-solid'
import { createSignal, For, type JSX, Show } from 'solid-js'
import { Loading } from '../../components'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import type { GoalDTO } from '../../types/api'
import { RANDOM_SONG_SELECTOR_COPY } from './randomSongSelector.constants'

/** 保存済み目標の選択に必要な状態と適用操作。 */
type RandomSongGoalDialogProps = {
  goals: GoalDTO[]
  selectedGoalId: number | null
  loading: boolean
  error?: string
  onApply: (id: number | null) => void
}

const NO_GOAL_VALUE = 'none'

/**
 * 保存済み目標を下書きとして選択し、適用時だけ選曲条件へ反映する。
 *
 * @param props - 利用可能な目標、取得状態、現在の選択と適用操作。
 * @returns 目標選択ボタンとスクロール可能なダイアログ。
 */
export const RandomSongGoalDialog = (props: RandomSongGoalDialogProps): JSX.Element => {
  const [open, setOpen] = createSignal(false)
  const [draftGoalId, setDraftGoalId] = createSignal<number | null>(null)
  /**
   * 開くたびに現在適用中の目標から下書きを作る。
   * @param nextOpen - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) setDraftGoalId(props.selectedGoalId)
    setOpen(nextOpen)
  }
  /** @returns 下書きの目標を適用できる場合は true。解除は取得失敗時にも許可する。 */
  const canApply = (): boolean =>
    draftGoalId() === null ||
    (!props.loading && !props.error && props.goals.some((goal) => goal.id === draftGoalId()))
  /** @returns 選択を適用し、ダイアログを閉じる。 */
  const handleApply = (): void => {
    if (!canApply()) return
    props.onApply(draftGoalId())
    setOpen(false)
  }
  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        as="button"
        type="button"
        class={getAppButtonClass({
          variant: props.selectedGoalId === null ? 'surface' : 'primary',
          class: 'min-h-10 rounded-md',
        })}
        aria-pressed={props.selectedGoalId !== null}
      >
        <Target size={16} aria-hidden="true" />
        {RANDOM_SONG_SELECTOR_COPY.goalFilterLabel}
        <Show when={props.goals.find((goal) => goal.id === props.selectedGoalId)}>
          {(goal) => <span class="max-w-48 truncate font-sans">{goal().title}</span>}
        </Show>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-60 flex flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[80dvh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <Dialog.Title class="shrink-0 text-lg font-bold">
            {RANDOM_SONG_SELECTOR_COPY.goalFilterDialogTitle}
          </Dialog.Title>
          <div class="mt-4 min-h-0 flex-1 basis-0 overflow-y-auto pr-1">
            <Show when={!props.loading} fallback={<Loading />}>
              <Show when={props.error}>
                {(error) => (
                  <p role="status" class="mb-3 text-sm text-danger">
                    {error()}
                  </p>
                )}
              </Show>
              <Show when={!props.error && props.goals.length === 0}>
                <p class="mb-3 text-sm text-text-muted">
                  {RANDOM_SONG_SELECTOR_COPY.goalFilterEmptyMessage}
                </p>
              </Show>
              <RadioGroup
                name="random-song-goal-filter"
                value={draftGoalId() === null ? NO_GOAL_VALUE : String(draftGoalId())}
                onChange={(value) => setDraftGoalId(value === NO_GOAL_VALUE ? null : Number(value))}
                aria-label={RANDOM_SONG_SELECTOR_COPY.goalFilterDialogTitle}
                class="grid gap-2"
              >
                <SelectableCardItem
                  value={NO_GOAL_VALUE}
                  title={RANDOM_SONG_SELECTOR_COPY.goalFilterNoneLabel}
                  ariaLabel={RANDOM_SONG_SELECTOR_COPY.goalFilterNoneLabel}
                  density="compact"
                  class="rounded-md"
                  titleClass="font-sans"
                />
                <Show when={!props.error}>
                  <For each={props.goals}>
                    {(goal) => (
                      <SelectableCardItem
                        value={String(goal.id)}
                        title={goal.title}
                        ariaLabel={goal.title}
                        density="compact"
                        class="rounded-md"
                        titleClass="font-sans"
                      />
                    )}
                  </For>
                </Show>
              </RadioGroup>
            </Show>
          </div>
          <div class="mt-4 flex shrink-0 justify-end gap-2">
            <Dialog.CloseButton class={getAppButtonClass({ variant: 'secondary' })}>
              {RANDOM_SONG_SELECTOR_COPY.goalFilterCancelLabel}
            </Dialog.CloseButton>
            <AppButton variant="primary" disabled={!canApply()} onClick={handleApply}>
              {RANDOM_SONG_SELECTOR_COPY.goalFilterApplyLabel}
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
