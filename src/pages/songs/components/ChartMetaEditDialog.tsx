import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import { createEffect, createSignal, Index, Show } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { DifficultyBadge } from '../../../components/common/DifficultyBadge'
import type { PlayerDataDifficulty, SongDTO, UpdateChartRequestDTO } from '../../../types/api'
import { normalizeChartConstRangeInput } from '../../../utils/rangeInput'
import {
  SONG_EDIT_COPY,
  SONG_EDIT_INPUT_LIMITS,
  SONG_EDIT_NUMBER_INPUT_CLASS,
  SONG_EDIT_TEXT_INPUT_CLASS,
} from '../songEditConstants'
import {
  buildChartDraftsFromSong,
  type ChartMetaEditDraft,
  hasNotesDesigner,
  normalizeNonNegativeIntegerInput,
  parseChartMetaDrafts,
} from '../utils/songMetaEdit'

type Props = {
  open: boolean
  song: SongDTO
  saving: boolean
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (charts: Record<string, UpdateChartRequestDTO>) => void
}

/**
 * 指定難易度の譜面ドラフトを部分更新する。
 *
 * @param drafts - 現在の譜面ドラフト。
 * @param difficulty - 更新対象の難易度。
 * @param patch - 上書きするフィールド。
 * @returns 更新後の譜面ドラフト。
 */
const patchChartDraft = (
  drafts: ChartMetaEditDraft[],
  difficulty: PlayerDataDifficulty,
  patch: Partial<ChartMetaEditDraft>
): ChartMetaEditDraft[] =>
  drafts.map((draft) => (draft.difficulty === difficulty ? { ...draft, ...patch } : draft))

/**
 * 通常譜面情報を編集するダイアログを描画する。
 *
 * @param props - 開閉状態、編集対象楽曲、保存ハンドラ。
 * @returns 譜面情報編集ダイアログ。
 */
const ChartMetaEditDialog: Component<Props> = (props) => {
  const [drafts, setDrafts] = createSignal<ChartMetaEditDraft[]>([])
  const [validationMessage, setValidationMessage] = createSignal('')
  const errorMessage = () => validationMessage() || props.apiErrorMessage

  createEffect(() => {
    if (!props.open) return
    setDrafts(buildChartDraftsFromSong(props.song))
    setValidationMessage('')
  })

  /**
   * 譜面情報編集フォームを検証して送信する。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const parsed = parseChartMetaDrafts(drafts())
    if (!parsed.ok) {
      setValidationMessage(parsed.message)
      return
    }

    setValidationMessage('')
    props.onSubmit(parsed.value)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex h-[90dvh] max-h-[90dvh] w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="shrink-0 text-lg font-bold text-text">
            {SONG_EDIT_COPY.chartDialogTitle}
          </Dialog.Title>
          <Dialog.Description class="sr-only">
            {SONG_EDIT_COPY.chartFormDescription}
          </Dialog.Description>

          <form class="mt-5 flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div class="min-h-0 flex-1 basis-0 space-y-4 overflow-y-auto pr-1">
              <Index each={drafts()}>
                {(draft) => (
                  <section class="space-y-3 rounded-md border border-border p-3">
                    <DifficultyBadge difficulty={draft().difficulty} />

                    <div class="grid grid-cols-2 gap-3">
                      <TextField>
                        <TextField.Label class="mb-1 block text-sm text-text-muted">
                          {SONG_EDIT_COPY.constLabel}
                        </TextField.Label>
                        <TextField.Input
                          value={draft().const}
                          inputMode="decimal"
                          class={SONG_EDIT_NUMBER_INPUT_CLASS}
                          onInput={(event) => {
                            const next = normalizeChartConstRangeInput(event.currentTarget.value)
                            if (next === null) return
                            setDrafts((current) =>
                              patchChartDraft(current, draft().difficulty, { const: next })
                            )
                          }}
                        />
                      </TextField>

                      <TextField>
                        <TextField.Label class="mb-1 block text-sm text-text-muted">
                          {SONG_EDIT_COPY.notesLabel}
                        </TextField.Label>
                        <TextField.Input
                          value={draft().notes}
                          inputMode="numeric"
                          class={SONG_EDIT_NUMBER_INPUT_CLASS}
                          onInput={(event) => {
                            const next = normalizeNonNegativeIntegerInput(event.currentTarget.value)
                            if (next === null) return
                            setDrafts((current) =>
                              patchChartDraft(current, draft().difficulty, { notes: next })
                            )
                          }}
                        />
                      </TextField>
                    </div>

                    <CheckboxField
                      checked={draft().is_const_unknown}
                      label={SONG_EDIT_COPY.constUnknownLabel}
                      onChange={(checked) =>
                        setDrafts((current) =>
                          patchChartDraft(current, draft().difficulty, {
                            is_const_unknown: checked,
                          })
                        )
                      }
                    />

                    <TextField disabled={!hasNotesDesigner(draft().difficulty)}>
                      <TextField.Label class="mb-1 block text-sm text-text-muted">
                        {SONG_EDIT_COPY.notesDesignerLabel}
                      </TextField.Label>
                      <TextField.Input
                        value={draft().notes_designer}
                        maxLength={SONG_EDIT_INPUT_LIMITS.notesDesigner}
                        class={SONG_EDIT_TEXT_INPUT_CLASS}
                        onInput={(event) =>
                          setDrafts((current) =>
                            patchChartDraft(current, draft().difficulty, {
                              notes_designer: event.currentTarget.value,
                            })
                          )
                        }
                      />
                    </TextField>
                  </section>
                )}
              </Index>

              <Show when={errorMessage()}>
                <p class="rounded border border-danger-border bg-danger-bg px-3 py-2 text-sm text-danger">
                  {errorMessage()}
                </p>
              </Show>
            </div>

            <div class="mt-5 flex shrink-0 justify-end gap-2">
              <AppButton onClick={() => props.onOpenChange(false)} disabled={props.saving}>
                {SONG_EDIT_COPY.cancelButton}
              </AppButton>
              <AppButton type="submit" variant="primary" disabled={props.saving}>
                {props.saving ? SONG_EDIT_COPY.savingButton : SONG_EDIT_COPY.saveButton}
              </AppButton>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default ChartMetaEditDialog
