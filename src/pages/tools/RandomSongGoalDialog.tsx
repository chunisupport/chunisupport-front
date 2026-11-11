import { Dialog } from '@kobalte/core/dialog'
import { RadioGroup } from '@kobalte/core/radio-group'
import Target from 'lucide-solid/icons/target'
import { createSignal, For, type JSX, Show } from 'solid-js'
import { Loading } from '../../components'
import { AppButton, getAppButtonClass } from '../../components/common/AppButton'
import { AppDialog } from '../../components/common/AppDialog'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import type { GoalDTO } from '../../types/api'
import { RANDOM_SONG_SELECTOR_COPY } from './randomSongSelector.constants'

/** 保存済み目標の選択に必要な状態と適用操作。 */
type RandomSongGoalDialogProps = {
  goals: GoalDTO[]
  selectedGoalId: number | null
  loading: boolean
  /** 目標選択ボタンを無効化するか */
  disabled?: boolean
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
    <AppDialog
      open={open()}
      onOpenChange={handleOpenChange}
      placement="viewport"
      size="2xl"
      height="viewport80"
      layer="raised"
      scroll="fill"
      bodyClass="mt-4 pr-1"
      title={RANDOM_SONG_SELECTOR_COPY.goalFilterDialogTitle}
      footer={
        <div class="mt-4 flex justify-end gap-2">
          <Dialog.CloseButton class={getAppButtonClass({ variant: 'secondary' })}>
            {RANDOM_SONG_SELECTOR_COPY.goalFilterCancelLabel}
          </Dialog.CloseButton>
          <AppButton variant="primary" disabled={!canApply()} onClick={handleApply}>
            {RANDOM_SONG_SELECTOR_COPY.goalFilterApplyLabel}
          </AppButton>
        </div>
      }
      trigger={
        <Dialog.Trigger
          as="button"
          type="button"
          class={getAppButtonClass({
            variant: props.selectedGoalId === null ? 'surface' : 'primary',
            class: 'min-h-10 rounded-md',
          })}
          aria-pressed={props.selectedGoalId !== null}
          disabled={props.disabled}
        >
          <Target size={16} aria-hidden="true" />
          {RANDOM_SONG_SELECTOR_COPY.goalFilterLabel}
          <Show when={props.goals.find((goal) => goal.id === props.selectedGoalId)}>
            {(goal) => <span class="max-w-48 truncate font-sans">{goal().title}</span>}
          </Show>
        </Dialog.Trigger>
      }
    >
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
    </AppDialog>
  )
}
