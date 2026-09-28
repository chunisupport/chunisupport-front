import { queryOptions } from '@tanstack/solid-query'
import { fetchChartStatsBatchJobs } from '../api/chartStatsBatch'
import { BATCH_JOB_RUNNING_POLL_INTERVAL_MS } from '../constants/batchJob'
import { findRunningBatchJob } from '../utils/batchJob'

/** 譜面統計バッチqueryのkey factory。 */
export const chartStatsBatchQueryKeys = {
  jobs: ['chart-stats-batch', 'jobs'] as const,
}

/**
 * 譜面統計バッチの実行履歴query optionsを生成する。
 * cron からの実行も含めて状態を追えるよう、実行中のジョブがある間だけ定期的に再取得する。
 *
 * @returns 実行履歴用query options。
 */
export const chartStatsBatchJobsQueryOptions = () =>
  queryOptions({
    queryKey: chartStatsBatchQueryKeys.jobs,
    queryFn: async ({ signal }) => (await fetchChartStatsBatchJobs(signal)).jobs,
    refetchInterval: (query) =>
      findRunningBatchJob(query.state.data ?? []) === null
        ? false
        : BATCH_JOB_RUNNING_POLL_INTERVAL_MS,
  })
