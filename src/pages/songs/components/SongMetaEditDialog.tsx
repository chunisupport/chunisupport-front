import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, Show } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { FormSelect } from '../../../components/common/AppSelect'
import type { MasterItemDTO } from '../../../types/api'
import { toInputValue } from '../../../utils/rangeInput'
import {
  SONG_EDIT_COPY,
  SONG_EDIT_NUMBER_INPUT_CLASS,
  SONG_EDIT_TEXT_INPUT_CLASS,
} from '../songEditConstants'
import {
  normalizeNonNegativeIntegerInput,
  parseSongMetaEditValues,
  type SongMetaEditValues,
  toDateInputValue,
} from '../utils/songMetaEdit'

type Props = {
  open: boolean
  genres: MasterItemDTO[]
  initialGenre: string | null
  initialBpm: number | null
  initialRelease: string | null
  requireGenre: boolean
  saving: boolean
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SongMetaEditValues) => void
}

/**
 * 楽曲情報（ジャンル、BPM、リリース日）を編集するダイアログを描画する。
 *
 * @param props - 開閉状態、初期値、ジャンル候補、保存ハンドラ。
 * @returns 楽曲情報編集ダイアログ。
 */
const SongMetaEditDialog: Component<Props> = (props) => {
  const [genreName, setGenreName] = createSignal<string | null>(null)
  const [bpm, setBpm] = createSignal('')
  const [releasedAt, setReleasedAt] = createSignal('')
  const [validationMessage, setValidationMessage] = createSignal('')

  const selectedGenre = createMemo(
    () => props.genres.find((genre) => genre.name === genreName()) ?? null
  )
  const errorMessage = () => validationMessage() || props.apiErrorMessage

  createEffect(() => {
    if (!props.open) return
    setGenreName(props.initialGenre)
    setBpm(toInputValue(props.initialBpm))
    setReleasedAt(toDateInputValue(props.initialRelease))
    setValidationMessage('')
  })

  /**
   * 楽曲情報編集フォームを検証して送信する。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    const parsed = parseSongMetaEditValues(
      {
        genreName: genreName(),
        bpm: bpm(),
        releasedAt: releasedAt(),
      },
      props.requireGenre
    )
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
            {SONG_EDIT_COPY.songDialogTitle}
          </Dialog.Title>
          <Dialog.Description class="sr-only">
            {SONG_EDIT_COPY.songFormDescription}
          </Dialog.Description>

          <form class="mt-5 flex min-h-0 flex-col" onSubmit={handleSubmit}>
            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <FormSelect<MasterItemDTO>
                label={SONG_EDIT_COPY.genreLabel}
                options={props.genres}
                optionValue="name"
                optionTextValue="name"
                value={selectedGenre()}
                onChange={(genre: MasterItemDTO | null) => setGenreName(genre?.name ?? null)}
                placeholder={SONG_EDIT_COPY.genrePlaceholder}
                contentZIndexClass="z-60"
                formatLabel={(genre) => genre.name}
              />

              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {SONG_EDIT_COPY.bpmLabel}
                </TextField.Label>
                <TextField.Input
                  value={bpm()}
                  inputMode="numeric"
                  class={SONG_EDIT_NUMBER_INPUT_CLASS}
                  onInput={(event) => {
                    const next = normalizeNonNegativeIntegerInput(event.currentTarget.value)
                    if (next === null) return
                    setBpm(next)
                  }}
                />
              </TextField>

              <TextField>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {SONG_EDIT_COPY.releaseLabel}
                </TextField.Label>
                <TextField.Input
                  type="date"
                  value={releasedAt()}
                  class={SONG_EDIT_TEXT_INPUT_CLASS}
                  onInput={(event) => setReleasedAt(event.currentTarget.value)}
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

export default SongMetaEditDialog
