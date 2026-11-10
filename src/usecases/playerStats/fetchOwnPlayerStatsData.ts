import { fetchMe } from '../../api/users'
import type { PlayerRecordDTO } from '../../types/api'
import { fetchUserRecordWithCache } from '../cache/fetchUserRecordWithCache'
import {
  fetchPlayerStatsChartMetadata,
  type PlayerStatsChartMetadata,
} from '../overpower/fetchTheoreticalTargetDifficulties'

/** ログインユーザー本人の通常譜面レコードと譜面メタ情報 */
export type OwnPlayerStatsData = PlayerStatsChartMetadata & {
  records: PlayerRecordDTO[]
}

/**
 * ログインユーザー本人の統計用レコードと譜面メタ情報を取得する。
 *
 * @returns 未プレイを含む通常譜面レコードと、曲ごとの譜面メタ情報。
 */
export const fetchOwnPlayerStatsData = async (): Promise<OwnPlayerStatsData> => {
  const user = await fetchMe()
  const [record, chartMetadata] = await Promise.all([
    fetchUserRecordWithCache(user.username),
    fetchPlayerStatsChartMetadata(),
  ])
  return { ...chartMetadata, records: record.standard }
}
