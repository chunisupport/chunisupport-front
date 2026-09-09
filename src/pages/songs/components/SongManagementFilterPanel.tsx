import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import { Funnel } from 'lucide-solid'
import { createSignal, Show } from 'solid-js'
import { AppButton, AppIconButton } from '../../../components/common/AppButton'
import { toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import { AppSelect } from '../../../components/common/AppSelect'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { GenreMultiSelect, VersionMultiSelect } from '../../../components/common/DomainMultiSelect'
import FilterResetDialog from '../../../components/common/FilterResetDialog'
import FilterResetHoldIndicator from '../../../components/common/filterReset/FilterResetHoldIndicator'
import { useFilterResetLongPress } from '../../../components/common/filterReset/useFilterResetLongPress'
import { RangeControlRow } from '../../../components/common/RangeInput'
import type { VersionSummaryDTO } from '../../../types/api'
import { getShortVersionName } from '../../../utils/versionConverter'
import { SONG_FILTER_INPUT_CLASS } from '../songFilters'
import {
  createSongManagementFilters,
  SONG_MANAGEMENT_FILTER_LABELS as LABELS,
  SONG_MANAGEMENT_MISSING_FIELD_OPTIONS,
  type SongManagementFilters,
} from '../songManagementFilters'

type Props = {
  /** ダイアログと操作要素のID接頭辞 */
  idPrefix: string
  filters: SongManagementFilters
  genres: string[]
  versions: readonly VersionSummaryDTO[]
  onChange: (filters: SongManagementFilters) => void
}

type MissingFieldOption = (typeof SONG_MANAGEMENT_MISSING_FIELD_OPTIONS)[number]

/**
 * 楽曲管理の検索欄に隣接する属性・欠落フィルターを表示する。
 *
 * @param props - 識別子、適用済み条件、選択肢と更新通知。
 * @returns フィルターボタンと編集用ダイアログ。
 */
export default function SongManagementFilterPanel(props: Props) {
  const [open, setOpen] = createSignal(false)
  const [draft, setDraft] = createSignal(props.filters)
  let triggerButton: HTMLButtonElement | undefined
  const active = () => {
    const filters = props.filters
    return (
      filters.releaseMin.length > 0 ||
      filters.releaseMax.length > 0 ||
      filters.genres !== null ||
      filters.versions !== null ||
      filters.missingOnly
    )
  }
  const dateInvalid = () =>
    !!(draft().releaseMin && draft().releaseMax && draft().releaseMin > draft().releaseMax)
  const selectedMissingField = () =>
    SONG_MANAGEMENT_MISSING_FIELD_OPTIONS.find((option) => option.value === draft().missingField) ??
    SONG_MANAGEMENT_MISSING_FIELD_OPTIONS[0]
  const filterResetLongPress = useFilterResetLongPress({
    isDisabled: () => false,
    onReset: () => props.onChange(createSongManagementFilters()),
    onClick: () => setOpen(true),
  })

  /**
   * ダイアログを開くときに適用済み条件を編集状態へ複製する。
   *
   * @param nextOpen - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) setDraft(props.filters)
    setOpen(nextOpen)
  }

  /**
   * 編集中フィルターの指定項目だけを更新する。
   *
   * @param key - 更新対象の項目。
   * @param value - 次の値。
   * @returns なし。
   */
  const update = <K extends keyof SongManagementFilters>(
    key: K,
    value: SongManagementFilters[K]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
      <div class="-ml-px relative shrink-0">
        <Show when={filterResetLongPress.hintVisible()}>
          <FilterResetHoldIndicator
            progress={filterResetLongPress.progress()}
            ready={filterResetLongPress.ready()}
            holdingLabel={LABELS.holdReset}
          />
        </Show>
        <AppIconButton
          ref={(element: HTMLButtonElement) => {
            triggerButton = element
          }}
          tone={filterResetLongPress.hintVisible() ? 'danger' : active() ? 'primary' : 'surface'}
          class="h-9.5 w-9.5 touch-none rounded-l-none rounded-r focus-visible:z-10"
          onClick={filterResetLongPress.handleClick}
          onPointerDown={filterResetLongPress.handlePointerDown}
          onPointerUp={filterResetLongPress.handlePointerUp}
          onPointerCancel={filterResetLongPress.stopPress}
          aria-label={active() ? LABELS.active : LABELS.title}
          aria-pressed={active()}
          aria-haspopup="dialog"
          aria-expanded={open()}
          aria-controls={`${props.idPrefix}-filter-dialog`}
          title={active() ? LABELS.active : LABELS.title}
        >
          <Funnel size={24} aria-hidden="true" />
        </AppIconButton>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content
          id={`${props.idPrefix}-filter-dialog`}
          class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-5/6 max-h-11/12 w-[90vw] max-w-md flex-col rounded-lg bg-surface p-6 shadow-lg"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerButton?.focus()
          }}
        >
          <div class="mb-4 flex shrink-0 items-center justify-between gap-2">
            <Dialog.Title class="text-lg font-bold">{LABELS.title}</Dialog.Title>
            <FilterResetDialog
              onReset={() => setDraft(createSongManagementFilters())}
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
              <div class="flex items-end gap-3 border-t border-border pt-4">
                <AppSelect<MissingFieldOption>
                  rootClass="min-w-0 flex-1"
                  label={LABELS.missingField}
                  labelVariant="srOnly"
                  options={[...SONG_MANAGEMENT_MISSING_FIELD_OPTIONS]}
                  optionValue="value"
                  optionTextValue="label"
                  value={selectedMissingField()}
                  onChange={(option) => update('missingField', option?.value ?? 'release')}
                  formatLabel={(option) => option.label}
                  itemClass="hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
                />
                <CheckboxField
                  id={`${props.idPrefix}-missing-only`}
                  checked={draft().missingOnly}
                  label={LABELS.missingOnly}
                  onChange={(checked) => update('missingOnly', checked)}
                  class="h-9.5 shrink-0"
                />
              </div>
            </div>
          </div>
          <div class="mt-6 flex shrink-0 justify-end gap-2">
            <Dialog.CloseButton as={AppButton}>{LABELS.cancel}</Dialog.CloseButton>
            <AppButton
              variant="primary"
              disabled={dateInvalid()}
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
 * 追加日範囲の片側をラベル付きで表示する。
 *
 * @param props - ラベル、値、エラー状態と更新通知。
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
