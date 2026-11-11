import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import Funnel from 'lucide-solid/icons/funnel'
import { createSignal, Show } from 'solid-js'
import { AppButton, AppIconButton } from '../../../components/common/AppButton'
import { AppDialog } from '../../../components/common/AppDialog'
import { toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import { AppSelect } from '../../../components/common/AppSelect'
import { CheckboxField } from '../../../components/common/CheckboxField'
import {
  GenreMultiSelect,
  NameFolderFilterMultiSelect,
  VersionMultiSelect,
} from '../../../components/common/DomainMultiSelect'
import FilterResetDialog from '../../../components/common/FilterResetDialog'
import FilterResetHoldIndicator from '../../../components/common/filterReset/FilterResetHoldIndicator'
import { useFilterResetLongPress } from '../../../components/common/filterReset/useFilterResetLongPress'
import { SONG_FILTER_INPUT_CLASS } from '../../../components/common/filterStyles'
import { RangeControlRow } from '../../../components/common/RangeInput'
import type { NameFolderDTO, VersionSummaryDTO } from '../../../types/api'
import { getShortVersionName } from '../../../utils/versionConverter'
import {
  createSongManagementFilters,
  SONG_MANAGEMENT_FILTER_LABELS as LABELS,
  SONG_MANAGEMENT_CATALOG_STATE_OPTIONS,
  SONG_MANAGEMENT_MISSING_FIELD_OPTIONS,
  type SongManagementCatalogState,
  type SongManagementFilters,
  type SongManagementMissingField,
} from '../songManagementFilters'

type Props = {
  /** ダイアログと操作要素のID接頭辞 */
  idPrefix: string
  filters: SongManagementFilters
  genres: string[]
  versions: readonly VersionSummaryDTO[]
  /** 楽曲名順フォルダ一覧（表示順） */
  nameFolders: readonly NameFolderDTO[]
  onChange: (filters: SongManagementFilters) => void
}

type FilterToggleSelectOption<T extends string> = {
  value: T
  label: string
}

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
      filters.nameFolders !== null ||
      filters.missingOnly ||
      filters.catalogOnly
    )
  }
  const dateInvalid = () =>
    !!(draft().releaseMin && draft().releaseMax && draft().releaseMin > draft().releaseMax)
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
    <AppDialog
      open={open()}
      onOpenChange={handleOpenChange}
      size="md"
      height="tall"
      contentId={`${props.idPrefix}-filter-dialog`}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        triggerButton?.focus()
      }}
      title={LABELS.title}
      headerActions={
        <FilterResetDialog
          onReset={() => setDraft(createSongManagementFilters())}
          showShortcutHint={false}
        />
      }
      scroll="fill"
      trigger={
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
      }
      footer={
        <div class="mt-6 flex justify-end gap-2">
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
      }
    >
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
        <NameFolderFilterMultiSelect
          nameFolders={props.nameFolders}
          selected={draft().nameFolders}
          onChange={(value) => update('nameFolders', value)}
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
        <div class="space-y-3 border-t border-border pt-4">
          <FilterToggleSelectRow<SongManagementMissingField>
            id={`${props.idPrefix}-missing-only`}
            checked={draft().missingOnly}
            onCheckedChange={(checked) => update('missingOnly', checked)}
            selectLabel={LABELS.missingField}
            options={SONG_MANAGEMENT_MISSING_FIELD_OPTIONS}
            value={draft().missingField}
            fallbackValue="release"
            onValueChange={(value) => update('missingField', value)}
            suffix={LABELS.missingOnly}
          />
          <FilterToggleSelectRow<SongManagementCatalogState>
            id={`${props.idPrefix}-catalog-only`}
            checked={draft().catalogOnly}
            onCheckedChange={(checked) => update('catalogOnly', checked)}
            selectLabel={LABELS.catalogField}
            options={SONG_MANAGEMENT_CATALOG_STATE_OPTIONS}
            value={draft().catalogState}
            fallbackValue="included"
            onValueChange={(value) => update('catalogState', value)}
            suffix={LABELS.catalogOnly}
          />
        </div>
      </div>
    </AppDialog>
  )
}

/**
 * チェックボックス、プルダウン、接尾辞テキストを1行で表示する。
 *
 * @param props - チェック状態、選択肢、接尾辞と更新通知。
 * @returns フィルター行。
 */
function FilterToggleSelectRow<T extends string>(props: {
  id: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  selectLabel: string
  options: readonly FilterToggleSelectOption<T>[]
  value: T
  fallbackValue: T
  onValueChange: (value: T) => void
  suffix: string
}) {
  const selected = (): FilterToggleSelectOption<T> =>
    props.options.find((option) => option.value === props.value) ??
    props.options.find((option) => option.value === props.fallbackValue) ??
    props.options[0] ?? { value: props.fallbackValue, label: props.fallbackValue }

  return (
    <div class="flex min-w-0 items-center gap-2">
      <CheckboxField
        id={props.id}
        checked={props.checked}
        onChange={props.onCheckedChange}
        class="shrink-0"
      />
      <AppSelect<FilterToggleSelectOption<T>>
        rootClass="min-w-0 flex-1"
        label={props.selectLabel}
        labelVariant="srOnly"
        options={[...props.options]}
        optionValue="value"
        optionTextValue="label"
        value={selected()}
        onChange={(option) => props.onValueChange(option?.value ?? props.fallbackValue)}
        formatLabel={(option) => option.label}
        itemClass="hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
      />
      <label for={props.id} class="shrink-0 cursor-pointer text-sm text-text-muted">
        {props.suffix}
      </label>
    </div>
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
