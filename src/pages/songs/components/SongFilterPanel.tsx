import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Funnel } from 'lucide-solid'
import { createMemo, createSignal, Show } from 'solid-js'
import { AppButton, AppIconButton } from '../../../components/common/AppButton'
import { toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import { GenreMultiSelect, VersionMultiSelect } from '../../../components/common/DomainMultiSelect'
import FilterResetDialog from '../../../components/common/FilterResetDialog'
import { RangeControlRow, TextRangeInput } from '../../../components/common/RangeInput'
import type { VersionSummaryDTO } from '../../../types/api'
import { getShortVersionName } from '../../../utils/versionConverter'
import {
  createSongFilters,
  SONG_FILTER_LABELS as LABELS,
  parseBpmFilter,
  SONG_FILTER_INPUT_CLASS,
  type SongFilters,
} from '../songFilters'

type Props = {
  filters: SongFilters
  onChange: (filters: SongFilters) => void
  genres: string[]
  versions: readonly VersionSummaryDTO[]
}

/**
 * 両方の楽曲一覧で共有する属性フィルタを表示する。
 * @param props - 条件、選択肢と更新通知。
 * @returns 検索欄に隣接するボタンとフィルターダイアログ。
 */
export default function SongFilterPanel(props: Props) {
  const [open, setOpen] = createSignal(false)
  const [draft, setDraft] = createSignal(props.filters)
  /**
   * 開くたびに適用済み条件から編集を開始する。
   * @param nextOpen - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(props.filters)
    setOpen(nextOpen)
  }
  const bpmInvalid = createMemo(() => {
    const min = parseBpmFilter(draft().bpmMin)
    const max = parseBpmFilter(draft().bpmMax)
    return min !== null && max !== null && min > max
  })
  const dateInvalid = () =>
    !!(draft().releaseMin && draft().releaseMax && draft().releaseMin > draft().releaseMax)
  const active = () =>
    Object.values(props.filters).some(
      (value) => value !== null && (Array.isArray(value) || value.length > 0)
    )
  /**
   * 指定された条件だけを更新する。
   * @param key - 更新対象のキー。
   * @param value - 新しい条件値。
   * @returns なし。
   */
  const update = <K extends keyof SongFilters>(key: K, value: SongFilters[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))
  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        as={AppIconButton}
        tone={active() ? 'primary' : 'surface'}
        class="h-9.5 w-9.5 shrink-0 rounded-l-none rounded-r"
        aria-label={active() ? LABELS.active : LABELS.title}
        title={active() ? LABELS.active : LABELS.title}
      >
        <Funnel size={24} aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-5/6 max-h-11/12 w-[90vw] max-w-md flex-col rounded-lg bg-surface p-6 shadow-lg">
          <div class="mb-4 flex shrink-0 items-center justify-between gap-2">
            <Dialog.Title class="text-lg font-bold">{LABELS.title}</Dialog.Title>
            <FilterResetDialog
              onReset={() => setDraft(createSongFilters())}
              showShortcutHint={false}
            />
          </div>
          <div class="min-h-0 flex-1 basis-0 overflow-y-auto">
            <div class="space-y-4">
              <GenreMultiSelect
                options={toMultiSelectOptions(props.genres)}
                selected={draft().genres ?? props.genres}
                onChange={(value) =>
                  update(
                    'genres',
                    value.length > 0 && value.length === props.genres.length ? null : value
                  )
                }
                placeholder={LABELS.unselected}
              />
              <VersionMultiSelect
                options={toMultiSelectOptions(
                  props.versions.map((version) => version.name),
                  getShortVersionName
                )}
                selected={draft().versions ?? props.versions.map((version) => version.name)}
                onChange={(value) =>
                  update(
                    'versions',
                    value.length > 0 && value.length === props.versions.length ? null : value
                  )
                }
                placeholder={LABELS.unselected}
              />
              <TextRangeInput
                title={LABELS.bpm}
                inputClass={SONG_FILTER_INPUT_CLASS}
                errorMessage={bpmInvalid() ? LABELS.rangeError : undefined}
                start={{
                  id: 'song-filter-bpm-min',
                  label: LABELS.bpmMin,
                  value: draft().bpmMin,
                  inputMode: 'decimal',
                  invalid: bpmInvalid(),
                  normalizeInput: normalizeBpmInput,
                  onChange: (value) => update('bpmMin', value),
                }}
                end={{
                  id: 'song-filter-bpm-max',
                  label: LABELS.bpmMax,
                  value: draft().bpmMax,
                  inputMode: 'decimal',
                  invalid: bpmInvalid(),
                  normalizeInput: normalizeBpmInput,
                  onChange: (value) => update('bpmMax', value),
                }}
              />
              <fieldset class="min-w-0">
                <legend class="mb-1 text-sm font-medium">{LABELS.release}</legend>
                <RangeControlRow
                  start={
                    <DateEndpoint
                      label={LABELS.releaseMin}
                      value={draft().releaseMin}
                      invalid={dateInvalid()}
                      onChange={(value) => update('releaseMin', value)}
                    />
                  }
                  end={
                    <DateEndpoint
                      label={LABELS.releaseMax}
                      value={draft().releaseMax}
                      invalid={dateInvalid()}
                      onChange={(value) => update('releaseMax', value)}
                    />
                  }
                />
                <Show when={dateInvalid()}>
                  <p class="mt-1 text-xs text-danger" role="alert">
                    {LABELS.rangeError}
                  </p>
                </Show>
              </fieldset>
            </div>
          </div>
          <div class="mt-6 flex shrink-0 justify-end gap-2">
            <Dialog.CloseButton as={AppButton}>{LABELS.cancel}</Dialog.CloseButton>
            <AppButton
              variant="primary"
              disabled={bpmInvalid() || dateInvalid()}
              onClick={() => {
                props.onChange(draft())
                setOpen(false)
              }}
            >
              {LABELS.apply}
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

/**
 * BPM欄で非負の小数と入力途中の値を許可する。
 * @param value - 入力文字列。
 * @returns 許可する入力。不正な文字列はnull。
 */
function normalizeBpmInput(value: string): string | null {
  return /^\d*(?:\.\d*)?$/.test(value) ? value : null
}

/**
 * 日付範囲の片側をラベル付きで表示する。
 * @param props - 日付、ラベル、エラー状態と更新通知。
 * @returns 日付入力欄。
 */
function DateEndpoint(props: {
  label: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  return (
    <TextField
      value={props.value}
      onChange={props.onChange}
      validationState={props.invalid ? 'invalid' : 'valid'}
    >
      <TextField.Label class="sr-only">{props.label}</TextField.Label>
      <TextField.Input type="date" class={SONG_FILTER_INPUT_CLASS} />
    </TextField>
  )
}
