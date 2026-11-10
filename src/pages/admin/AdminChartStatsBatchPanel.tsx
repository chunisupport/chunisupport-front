import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, Show } from 'solid-js'
import { startChartStatsBatchJob } from '../../api/chartStatsBatch'
import { AppConfirmDialog } from '../../components/common/AppConfirmDialog'
import { showSuccessToast } from '../../components/common/AppToast'
import {
  chartStatsBatchJobsQueryOptions,
  chartStatsBatchQueryKeys,
} from '../../queries/chartStatsBatch'
import { findRunningBatchJob } from '../../utils/batchJob'
import { toUserFriendlyErrorMessage } from '../../utils/errorMessage'
import { BatchJobCard, BatchJobHistory, BatchJobRunButton } from './AdminBatchJob'
import { BATCH_JOB_COPY, CHART_STATS_BATCH_COPY } from './adminBatch.constants'

/**
 * バッチ管理画面の譜面統計バッチタブ。譜面統計の再集計を実行し、実行履歴を確認する。
 *
 * @returns 実行ボタン、確認ダイアログ、実行履歴。
 */
const AdminChartStatsBatchPanel = (): JSX.Element => {
  const queryClient = useQueryClient()
  const jobsQuery = useQuery(() => chartStatsBatchJobsQueryOptions())
  const startMutation = useMutation(() => ({
    mutationFn: startChartStatsBatchJob,
    onSettled: () => queryClient.invalidateQueries({ queryKey: chartStatsBatchQueryKeys.jobs }),
  }))

  const [confirmationOpen, setConfirmationOpen] = createSignal(false)
  const [actionError, setActionError] = createSignal('')

  const runningJob = createMemo(() => findRunningBatchJob(jobsQuery.data ?? []))
  // 実行中かどうか分からない間は実行させず、サーバー側の排他だけに頼らない
  const isRunDisabled = createMemo(
    () => jobsQuery.data === undefined || runningJob() !== null || startMutation.isPending
  )

  /**
   * 確認ダイアログを開く。
   *
   * @param event - 実行フォームの送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    if (isRunDisabled()) return

    setActionError('')
    setConfirmationOpen(true)
  }

  /**
   * ジョブの開始を一度だけ要求する。成功時はトーストで通知する。
   *
   * @returns なし。
   */
  const handleConfirm = (): void => {
    if (startMutation.isPending) return

    startMutation.mutate(undefined, {
      onSuccess: () => showSuccessToast(CHART_STATS_BATCH_COPY.startSuccess),
      onError: (error) =>
        setActionError(toUserFriendlyErrorMessage(error, CHART_STATS_BATCH_COPY.startFailure)),
      onSettled: () => setConfirmationOpen(false),
    })
  }

  return (
    <div class="flex flex-col gap-4">
      <form
        class="rounded-lg border border-border bg-surface p-4 sm:p-5"
        aria-labelledby="chart-stats-batch-run-heading"
        aria-busy={startMutation.isPending}
        onSubmit={handleSubmit}
      >
        <div class="flex items-center justify-between gap-3">
          <h2 id="chart-stats-batch-run-heading" class="text-sm font-medium text-text-muted">
            {BATCH_JOB_COPY.runSection}
          </h2>
          <BatchJobRunButton
            running={runningJob() !== null}
            disabled={isRunDisabled()}
            variant="primary"
          />
        </div>

        <Show when={actionError()}>
          <p class="mt-3 text-sm text-danger" role="alert">
            {actionError()}
          </p>
        </Show>
      </form>

      <BatchJobHistory
        headingId="chart-stats-batch-history-heading"
        query={jobsQuery}
        renderJob={(job) => <BatchJobCard job={job} />}
      />

      <AppConfirmDialog
        open={confirmationOpen()}
        onOpenChange={setConfirmationOpen}
        title={CHART_STATS_BATCH_COPY.confirmTitle}
        description={CHART_STATS_BATCH_COPY.confirmDescription}
        cancelLabel={BATCH_JOB_COPY.cancelButton}
        confirmLabel={
          startMutation.isPending ? BATCH_JOB_COPY.submitting : CHART_STATS_BATCH_COPY.confirmButton
        }
        confirmVariant="primary"
        pending={startMutation.isPending}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export default AdminChartStatsBatchPanel
