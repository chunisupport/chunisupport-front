import { Dialog } from '@kobalte/core/dialog'
import Download from 'lucide-solid/icons/download'
import { createSignal, For, Show } from 'solid-js'
import { Loading } from '../../../components'
import { AppButton } from '../../../components/common/AppButton'
import { AppDialog } from '../../../components/common/AppDialog'
import { SegmentedToggleGroup } from '../../../components/common/AppTabs'
import { CheckboxField } from '../../../components/common/CheckboxField'
import { fetchChartStatsList } from '../../../queries/chartStats'
import type {
  ChartStats,
  ChartStatsDifficulty,
  ChartStatsResponse,
} from '../../../types/chartStats'
import {
  type ChartStatsExportFormat,
  createChartStatsExportFile,
  toggleChartStatsExportDifficulty,
} from '../../../utils/chartStatsExport'
import { downloadBlobFile } from '../../../utils/fileDownload'
import {
  CHART_STATS_COPY,
  CHART_STATS_DEFAULT_EXPORT_FORMAT,
  CHART_STATS_DIFFICULTY_OPTIONS,
  CHART_STATS_EXPORT_OPTIONS,
} from './constants'

type ChartStatsDownloadDialogProps = {
  /** 画面で表示中の難易度。ダイアログを開くたびにこの難易度だけを選択状態にする */
  currentDifficulty: ChartStatsDifficulty
  /** 画面の検索・フィルター条件で譜面を絞り込む処理 */
  filterCharts: (stats: ChartStatsResponse) => ChartStats[]
  /** 指定難易度すべてに画面のフィルター条件を適用できる状態か判定する処理 */
  isFilterReady: (difficulties: readonly ChartStatsDifficulty[]) => boolean
}

/**
 * 複数難易度のレコード統計を選んで1ファイルにまとめてダウンロードするダイアログを表示する。
 * 通常難易度とWORLD'S ENDは列構成が異なるため、どちらか一方だけを選べる。
 *
 * @param props - 表示中の難易度と、画面の条件で譜面を絞り込む処理。
 * @returns ダウンロードボタンとダイアログ。
 */
export const ChartStatsDownloadDialog = (props: ChartStatsDownloadDialogProps) => {
  const [open, setOpen] = createSignal(false)
  const [difficulties, setDifficulties] = createSignal<ChartStatsDifficulty[]>([])
  const [format, setFormat] = createSignal<ChartStatsExportFormat>(
    CHART_STATS_DEFAULT_EXPORT_FORMAT
  )
  const [applyFilter, setApplyFilter] = createSignal(true)
  const [downloading, setDownloading] = createSignal(false)
  const [failed, setFailed] = createSignal(false)

  /** 条件を適用する場合に、必要な楽曲属性の取得を待っているか */
  const waitingFilter = () => applyFilter() && !props.isFilterReady(difficulties())
  const busy = () => downloading() || waitingFilter()

  /**
   * 開くたびに表示中の難易度だけを選んだ状態から始める。ダウンロード中は閉じない。
   *
   * @param nextOpen - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen && downloading()) return
    if (nextOpen) {
      setDifficulties([props.currentDifficulty])
      setFailed(false)
    }
    setOpen(nextOpen)
  }

  /**
   * 選択した難易度の統計を取得し、指定形式の1ファイルとしてダウンロードする。
   *
   * @returns なし。
   */
  const download = async (): Promise<void> => {
    setDownloading(true)
    setFailed(false)
    try {
      const statsList = await fetchChartStatsList(difficulties())
      const exported = statsList.map((stats) =>
        applyFilter() ? { ...stats, charts: props.filterCharts(stats) } : stats
      )
      const file = createChartStatsExportFile(exported, format())
      downloadBlobFile(file.blob, file.filename)
      setOpen(false)
    } catch {
      setFailed(true)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <AppDialog
      open={open()}
      onOpenChange={handleOpenChange}
      pending={downloading()}
      size="sm"
      height="cap"
      title={CHART_STATS_COPY.download}
      closeLabel={CHART_STATS_COPY.downloadClose}
      scroll="cap"
      bodyClass="mt-4 space-y-5"
      footer={
        <div class="mt-6 flex flex-col items-end gap-2">
          <Show when={failed()}>
            <p class="text-sm text-danger" role="alert">
              {CHART_STATS_COPY.downloadFailed}
            </p>
          </Show>
          <AppButton
            variant="primary"
            disabled={difficulties().length === 0 || busy()}
            aria-busy={busy()}
            leftIcon={
              <Show when={busy()} fallback={<Download size={16} aria-hidden="true" />}>
                <Loading size="inline" ariaLabel={CHART_STATS_COPY.downloading} />
              </Show>
            }
            onClick={download}
          >
            {CHART_STATS_COPY.download}
          </AppButton>
        </div>
      }
      trigger={
        <Dialog.Trigger
          as={AppButton}
          variant="surface"
          size="sm"
          class="shrink-0"
          leftIcon={<Download size={16} aria-hidden="true" />}
        >
          {CHART_STATS_COPY.download}
        </Dialog.Trigger>
      }
    >
      <fieldset>
        <legend class="mb-2 text-sm font-semibold">{CHART_STATS_COPY.downloadDifficulty}</legend>
        <div class="flex flex-col items-start gap-1">
          <For each={CHART_STATS_DIFFICULTY_OPTIONS}>
            {(option) => (
              <CheckboxField
                id={`chart-stats-download-${option.value}`}
                checked={difficulties().includes(option.value)}
                onChange={(checked) =>
                  setDifficulties((current) =>
                    toggleChartStatsExportDifficulty(current, option.value, checked)
                  )
                }
                label={option.label}
                textVariant="large"
              />
            )}
          </For>
        </div>
      </fieldset>
      <fieldset>
        <legend class="mb-2 text-sm font-semibold">{CHART_STATS_COPY.downloadFormat}</legend>
        <SegmentedToggleGroup
          options={CHART_STATS_EXPORT_OPTIONS}
          value={format()}
          onChange={setFormat}
          ariaLabel={CHART_STATS_COPY.downloadFormat}
          itemClass="font-sans focus-visible:ring-inset"
        />
      </fieldset>
      <CheckboxField
        id="chart-stats-download-apply-filter"
        checked={applyFilter()}
        onChange={setApplyFilter}
        label={CHART_STATS_COPY.downloadApplyFilter}
        textVariant="large"
      />
    </AppDialog>
  )
}
