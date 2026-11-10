import { queryOptions } from '@tanstack/solid-query'
import { fetchSongBatchJobs } from '../api/songBatch'
import { BATCH_JOB_RUNNING_POLL_INTERVAL_MS } from '../constants/batchJob'
import { findRunningBatchJob } from '../utils/batchJob'

/** 楽曲バッチqueryのkey factory。 */
export const songBatchQueryKeys = {
  jobs: ['song-batch', 'jobs'] as const,
}

/**
 * 楽曲バッチの実行履歴query optionsを生成する。
 * cron からの実行も含めて状態を追えるよう、実行中のジョブがある間だけ定期的に再取得する。
 *
 * @returns 実行履歴用query options。
 */
export const songBatchJobsQueryOptions = () =>
  queryOptions({
    queryKey: songBatchQueryKeys.jobs,
    queryFn: async ({ signal }) => (await fetchSongBatchJobs(signal)).jobs,
    refetchInterval: (query) =>
      findRunningBatchJob(query.state.data ?? []) === null
        ? false
        : BATCH_JOB_RUNNING_POLL_INTERVAL_MS,
  })
