import { Dialog } from '@kobalte/core/dialog'
import Funnel from 'lucide-solid/icons/funnel'
import { createSignal, Show } from 'solid-js'
import { AppButton, AppIconButton } from '../../../components/common/AppButton'
import { AppDialog } from '../../../components/common/AppDialog'
import { toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import ChartConstRangeField from '../../../components/common/ChartConstRangeField'
import {
  GenreMultiSelect,
  NameFolderFilterMultiSelect,
  VersionMultiSelect,
} from '../../../components/common/DomainMultiSelect'
import FilterResetDialog from '../../../components/common/FilterResetDialog'
import FilterResetHoldIndicator from '../../../components/common/filterReset/FilterResetHoldIndicator'
import { useFilterResetLongPress } from '../../../components/common/filterReset/useFilterResetLongPress'
import { createChartConstRangeDraft } from '../../../hooks/createChartConstRangeDraft'
import type { NameFolderDTO } from '../../../types/api'
import {
  type ChartStatsAttributeFilter,
  type ChartStatsVersionMeta,
  createDefaultChartStatsAttributeFilter,
  isChartStatsAttributeFilterActive,
} from '../../../utils/chartStats'
import { getShortVersionName } from '../../../utils/versionConverter'
import { CHART_STATS_COPY } from './constants'

type ChartStatsFilterPanelProps = {
  /** ダイアログと操作要素のID接頭辞 */
  idPrefix: string
  /** 現在適用中のレベル・譜面定数・バージョン・ジャンル・楽曲名順条件 */
  filters: ChartStatsAttributeFilter
  /** フィルター確定時の通知先 */
  onChange: (filters: ChartStatsAttributeFilter) => void
  /** ジャンル選択肢 */
  genres: readonly string[]
  /** バージョン選択肢（フルネームと稼働開始日） */
  versions: readonly ChartStatsVersionMeta[]
  /** 楽曲名順フォルダ一覧（表示順） */
  nameFolders: readonly NameFolderDTO[]
  /** 楽曲マスタ取得前など操作を無効化する場合はtrue */
  disabled?: boolean
  /** レベル・譜面定数範囲を表示する場合はtrue */
  showConstFilter: boolean
}

/**
 * レコード統計の曲名検索に隣接するフィルターボタンと条件編集ダイアログを表示する。
 *
 * @param props - 適用中条件、選択肢、更新通知、無効状態を含む表示設定。
 * @returns 検索欄に隣接するボタンとフィルターダイアログ。
 */
export const ChartStatsFilterPanel = (props: ChartStatsFilterPanelProps) => {
  const [open, setOpen] = createSignal(false)
  const [draft, setDraft] = createSignal<ChartStatsAttributeFilter>(props.filters)
  const constRangeDraft = createChartConstRangeDraft({
    get: () => draft(),
    set: (next) => setDraft((current) => ({ ...current, ...next })),
  })
  let triggerButton: HTMLButtonElement | undefined

  /**
   * 開くたびに適用済み条件から編集を開始する。
   *
   * @param nextOpen - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (nextOpen) {
      setDraft(props.filters)
      constRangeDraft.sync(props.filters.constRange)
    }
    setOpen(nextOpen)
  }

  const active = () => isChartStatsAttributeFilterActive(props.filters)
  const filterResetLongPress = useFilterResetLongPress({
    isDisabled: () => Boolean(props.disabled),
    onReset: () => props.onChange(createDefaultChartStatsAttributeFilter()),
    onClick: () => setOpen(true),
  })

  /**
   * 下書きの指定条件だけを更新する。
   *
   * @param key - 更新対象のキー。
   * @param value - 新しい条件値。
   * @returns なし。
   */
  const update = <K extends keyof ChartStatsAttributeFilter>(
    key: K,
    value: ChartStatsAttributeFilter[K]
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const versionNames = () => props.versions.map((version) => version.name)

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
      title={CHART_STATS_COPY.filterTitle}
      headerActions={
        <FilterResetDialog
          onReset={() => {
            const defaultFilter = createDefaultChartStatsAttributeFilter()
            setDraft(defaultFilter)
            constRangeDraft.sync(defaultFilter.constRange)
          }}
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
              holdingLabel={CHART_STATS_COPY.filterHoldReset}
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
            aria-label={active() ? CHART_STATS_COPY.filterActive : CHART_STATS_COPY.filterTitle}
            aria-pressed={active()}
            aria-haspopup="dialog"
            aria-expanded={open()}
            aria-controls={`${props.idPrefix}-filter-dialog`}
            title={active() ? CHART_STATS_COPY.filterActive : CHART_STATS_COPY.filterTitle}
            disabled={props.disabled}
          >
            <Funnel size={24} aria-hidden="true" />
          </AppIconButton>
        </div>
      }
      footer={
        <div class="mt-6 flex justify-end gap-2">
          <Dialog.CloseButton as={AppButton}>{CHART_STATS_COPY.filterCancel}</Dialog.CloseButton>
          <AppButton
            variant="primary"
            onClick={() => {
              props.onChange(draft())
              setOpen(false)
            }}
          >
            {CHART_STATS_COPY.filterApply}
          </AppButton>
        </div>
      }
    >
      <div class="space-y-4">
        <Show when={props.showConstFilter}>
          <ChartConstRangeField idPrefix={props.idPrefix} {...constRangeDraft.fieldProps} />
        </Show>
        <GenreMultiSelect
          options={toMultiSelectOptions(props.genres)}
          selected={draft().genres ?? [...props.genres]}
          onChange={(value) =>
            update(
              'genres',
              value.length > 0 && value.length === props.genres.length ? null : [...value]
            )
          }
          placeholder={CHART_STATS_COPY.filterUnselected}
        />
        <VersionMultiSelect
          options={toMultiSelectOptions(versionNames(), getShortVersionName)}
          selected={draft().versions ?? versionNames()}
          onChange={(value) =>
            update(
              'versions',
              value.length > 0 && value.length === versionNames().length ? null : [...value]
            )
          }
          placeholder={CHART_STATS_COPY.filterUnselected}
        />
        <NameFolderFilterMultiSelect
          nameFolders={props.nameFolders}
          selected={draft().nameFolders}
          onChange={(value) => update('nameFolders', value)}
          placeholder={CHART_STATS_COPY.filterUnselected}
        />
      </div>
    </AppDialog>
  )
}
