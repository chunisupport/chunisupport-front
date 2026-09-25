import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, Show } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { FormSelect } from '../../../components/common/AppSelect'
import CopyFromStandardField from '../../../components/common/CopyFromStandardField'
import type { MasterItemDTO } from '../../../types/api'
import { toInputValue } from '../../../utils/rangeInput'
import type { StandardSongLookupItem } from '../../../utils/standardSongLookup'
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
import SongEditSaveButton from './SongEditSaveButton'

type Props = {
  open: boolean
  genres: MasterItemDTO[]
  initialGenre: string | null
  initialBpm: number | null
  initialRelease: string | null
  /** 編集前のWikiページタイトル */
  initialWikiPageTitle: string | null
  requireGenre: boolean
  saving: boolean
  apiErrorMessage: string
  onOpenChange: (open: boolean) => void
  onSubmit: (values: SongMetaEditValues) => void
  /** STANDARD楽曲からBPM・Wikiページタイトルを取り込むボタンを表示するか */
  enableCopyFromStandard?: boolean
  /** 取り込みに使うSTANDARD楽曲一覧 */
  standardSongs?: readonly StandardSongLookupItem[]
  /** 取り込みに使う曲名 */
  copyTitle?: string
  /** 取り込みに使うアーティスト名 */
  copyArtist?: string
  /** STANDARD楽曲一覧の読み込み中かどうか */
  standardSongsLoading?: boolean
}

type WikiPageTitleTextFieldProps = {
  /** 入力中のWikiページタイトル */
  value: string
  /** 入力値を反映する処理 */
  onChange: (value: string) => void
}

/**
 * 楽曲情報編集ダイアログのWikiページタイトル入力欄を描画する。
 *
 * @param props - 入力値と変更ハンドラ。
 * @returns Wikiページタイトル用の Kobalte TextField。
 */
const WikiPageTitleTextField: Component<WikiPageTitleTextFieldProps> = (props) => (
  <TextField value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block text-sm text-text-muted">
      {SONG_EDIT_COPY.wikiPageTitleLabel}
    </TextField.Label>
    <TextField.Input class={SONG_EDIT_TEXT_INPUT_CLASS} />
  </TextField>
)

type BpmTextFieldProps = {
  /** 入力中のBPM文字列 */
  value: string
  /** 正規化済みの入力値を反映する処理 */
  onInput: (value: string) => void
}

/**
 * 楽曲情報編集ダイアログのBPM入力欄を描画する。
 *
 * @param props - 入力値と変更ハンドラ。
 * @returns BPM用の Kobalte TextField。
 */
const BpmTextField: Component<BpmTextFieldProps> = (props) => (
  <TextField>
    <TextField.Label class="mb-1 block text-sm text-text-muted">
      {SONG_EDIT_COPY.bpmLabel}
    </TextField.Label>
    <TextField.Input
      value={props.value}
      inputMode="numeric"
      class={SONG_EDIT_NUMBER_INPUT_CLASS}
      onInput={(event) => {
        const next = normalizeNonNegativeIntegerInput(event.currentTarget.value)
        if (next === null) return
        props.onInput(next)
      }}
    />
  </TextField>
)

/**
 * 楽曲情報（ジャンル、BPM、リリース日、Wikiページタイトル）を編集するダイアログを描画する。
 * WORLD'S ENDでは同じ曲名・アーティスト名のSTANDARD楽曲からBPM・Wikiページタイトルを取り込める。
 *
 * @param props - 開閉状態、初期値、ジャンル候補、保存ハンドラ、STANDARD取り込み設定。
 * @returns 楽曲情報編集ダイアログ。
 */
const SongMetaEditDialog: Component<Props> = (props) => {
  const [genreName, setGenreName] = createSignal<string | null>(null)
  const [bpm, setBpm] = createSignal('')
  const [releasedAt, setReleasedAt] = createSignal('')
  const [wikiPageTitle, setWikiPageTitle] = createSignal('')
  const [validationMessage, setValidationMessage] = createSignal('')
  const [initialValues, setInitialValues] = createSignal({
    genreName: null as string | null,
    bpm: '',
    releasedAt: '',
    wikiPageTitle: '',
  })

  const selectedGenre = createMemo(
    () => props.genres.find((genre) => genre.name === genreName()) ?? null
  )
  const errorMessage = () => validationMessage() || props.apiErrorMessage
  const changed = createMemo(
    () =>
      genreName() !== initialValues().genreName ||
      bpm() !== initialValues().bpm ||
      releasedAt() !== initialValues().releasedAt ||
      wikiPageTitle() !== initialValues().wikiPageTitle
  )

  createEffect(() => {
    if (!props.open) return
    const values = {
      genreName: props.initialGenre,
      bpm: toInputValue(props.initialBpm),
      releasedAt: toDateInputValue(props.initialRelease),
      wikiPageTitle: props.initialWikiPageTitle ?? '',
    }
    setInitialValues(values)
    setGenreName(values.genreName)
    setBpm(values.bpm)
    setReleasedAt(values.releasedAt)
    setWikiPageTitle(values.wikiPageTitle)
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
    if (!changed() || props.saving) return
    const parsed = parseSongMetaEditValues(
      {
        genreName: genreName(),
        bpm: bpm(),
        releasedAt: releasedAt(),
        wikiPageTitle: wikiPageTitle(),
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

              <Show
                when={props.enableCopyFromStandard}
                fallback={<BpmTextField value={bpm()} onInput={setBpm} />}
              >
                <CopyFromStandardField
                  field="bpm"
                  songs={props.standardSongs ?? []}
                  title={props.copyTitle ?? ''}
                  artist={props.copyArtist ?? ''}
                  songsLoading={props.standardSongsLoading}
                  onCopied={(nextBpm) => {
                    setBpm(toInputValue(nextBpm))
                    setValidationMessage('')
                  }}
                >
                  <BpmTextField value={bpm()} onInput={setBpm} />
                </CopyFromStandardField>
              </Show>

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

              <Show
                when={props.enableCopyFromStandard}
                fallback={
                  <WikiPageTitleTextField value={wikiPageTitle()} onChange={setWikiPageTitle} />
                }
              >
                <CopyFromStandardField
                  field="wikiPageTitle"
                  songs={props.standardSongs ?? []}
                  title={props.copyTitle ?? ''}
                  artist={props.copyArtist ?? ''}
                  songsLoading={props.standardSongsLoading}
                  onCopied={(nextWikiPageTitle) => {
                    setWikiPageTitle(nextWikiPageTitle)
                    setValidationMessage('')
                  }}
                >
                  <WikiPageTitleTextField value={wikiPageTitle()} onChange={setWikiPageTitle} />
                </CopyFromStandardField>
              </Show>

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
              <SongEditSaveButton changed={changed()} saving={props.saving} />
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default SongMetaEditDialog
