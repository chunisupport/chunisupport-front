import { queryOptions } from '@tanstack/solid-query'
import { fetchSongBatchJobs } from '../api/songBatch'
import { SONG_BATCH_RUNNING_POLL_INTERVAL_MS } from '../constants/songBatch'
import { findRunningSongBatchJob } from '../utils/songBatchJob'

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
      findRunningSongBatchJob(query.state.data ?? []) === null
        ? false
        : SONG_BATCH_RUNNING_POLL_INTERVAL_MS,
  })
