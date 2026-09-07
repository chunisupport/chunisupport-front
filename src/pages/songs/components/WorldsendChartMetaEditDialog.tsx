import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import { createEffect, createSignal, Show } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { WORLDSEND_LEVEL_STAR_MAX, WORLDSEND_LEVEL_STAR_MIN } from '../../../constants/chart'
import type { UpdateWorldsendChartRequestDTO, WorldsendSongDTO } from '../../../types/api'
import { toInputValue } from '../../../utils/rangeInput'
import {
  SONG_EDIT_COPY,
  SONG_EDIT_INPUT_LIMITS,
  SONG_EDIT_NUMBER_INPUT_CLASS,
  SONG_EDIT_TEXT_INPUT_CLASS,
} from '../songEditConstants'
import {
  normalizeNonNegativeIntegerInput,
  parseWorldsendChartMetaEditValues,
} from '../utils/songMetaEdit'

type Props = {
  open: boolean
  song: WorldsendSongDTO
  saving: boolean
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (chart: UpdateWorldsendChartRequestDTO) => void
}

/**
 * WORLD'S END 譜面情報を編集するダイアログを描画する。
 *
 * @param props - 開閉状態、編集対象楽曲、保存ハンドラ。
 * @returns WORLD'S END 譜面情報編集ダイアログ。
 */
const WorldsendChartMetaEditDialog: Component<Props> = (props) => {
  const [attribute, setAttribute] = createSignal('')
  const [levelStar, setLevelStar] = createSignal('')
  const [notes, setNotes] = createSignal('')
  const [notesDesigner, setNotesDesigner] = createSignal('')
  const [validationMessage, setValidationMessage] = createSignal('')
  const errorMessage = () => validationMessage() || props.apiErrorMessage

  createEffect(() => {
    if (!props.open) return
    const chart = props.song.charts.WORLDSEND
    setAttribute(chart?.attribute ?? '')
    setLevelStar(toInputValue(chart?.level_star))
    setNotes(toInputValue(chart?.notes))
    setNotesDesigner(chart?.notes_designer ?? '')
    setValidationMessage('')
  })

  /**
   * WORLD'S END 譜面編集フォームを検証して送信する。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const parsed = parseWorldsendChartMetaEditValues({
      attribute: attribute(),
      levelStar: levelStar(),
      notes: notes(),
      notesDesigner: notesDesigner(),
    })
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
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="shrink-0 text-lg font-bold text-text">
            {SONG_EDIT_COPY.chartDialogTitle}
          </Dialog.Title>
          <Dialog.Description class="sr-only">
            {SONG_EDIT_COPY.worldsendChartFormDescription}
          </Dialog.Description>

          <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit}>
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {SONG_EDIT_COPY.attributeLabel}
                </TextField.Label>
                <TextField.Input
                  value={attribute()}
                  class={SONG_EDIT_TEXT_INPUT_CLASS}
                  onInput={(event) => setAttribute(event.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {SONG_EDIT_COPY.levelLabel}
                </TextField.Label>
                <TextField.Input
                  value={levelStar()}
                  inputMode="numeric"
                  min={String(WORLDSEND_LEVEL_STAR_MIN)}
                  max={String(WORLDSEND_LEVEL_STAR_MAX)}
                  class={SONG_EDIT_NUMBER_INPUT_CLASS}
                  onInput={(event) => {
                    const next = normalizeNonNegativeIntegerInput(event.currentTarget.value)
                    if (next === null) return
                    setLevelStar(next)
                  }}
                />
              </TextField>

              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {SONG_EDIT_COPY.notesLabel}
                </TextField.Label>
                <TextField.Input
                  value={notes()}
                  inputMode="numeric"
                  class={SONG_EDIT_NUMBER_INPUT_CLASS}
                  onInput={(event) => {
                    const next = normalizeNonNegativeIntegerInput(event.currentTarget.value)
                    if (next === null) return
                    setNotes(next)
                  }}
                />
              </TextField>

              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {SONG_EDIT_COPY.notesDesignerLabel}
                </TextField.Label>
                <TextField.Input
                  value={notesDesigner()}
                  maxLength={SONG_EDIT_INPUT_LIMITS.notesDesigner}
                  class={SONG_EDIT_TEXT_INPUT_CLASS}
                  onInput={(event) => setNotesDesigner(event.currentTarget.value)}
                />
              </TextField>

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

export default WorldsendChartMetaEditDialog
