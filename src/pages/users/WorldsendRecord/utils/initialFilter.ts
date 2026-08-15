import { readWorldsendRecordFilterSetting } from '../../../../repositories/viewSettingsRepository'
import type { VersionSummaryDTO, WorldsendSongDTO } from '../../../../types/api'
import { isValidSavedWorldsendFilter } from '../../components/savedRecordFilters'
import { buildDefaultWorldsendFilter } from '../types/filterDefaults'
import type { WorldsendFilterState } from '../types/filterTypes'

/**
 * WORLD'S END レコードの初期フィルターを保存済み設定、または既定値から決定する。
 *
 * @param songs - フィルター既定値の構築に使う WORLD'S END 楽曲一覧。
 * @param versions - フィルター既定値の構築に使うバージョン一覧。
 * @returns 初回表示に適用する WORLD'S END フィルター状態。
 */
export const restoreInitialWorldsendRecordFilter = async (
  songs: WorldsendSongDTO[],
  versions: VersionSummaryDTO[]
): Promise<WorldsendFilterState> => {
  const defaultFilter = buildDefaultWorldsendFilter(songs, versions)

  try {
    const savedFilter = await readWorldsendRecordFilterSetting()
    return isValidSavedWorldsendFilter(savedFilter) ? savedFilter : defaultFilter
  } catch {
    return defaultFilter
  }
}
