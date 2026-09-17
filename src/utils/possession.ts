import { DEFAULT_POSSESSION_NAME, isPossessionName } from '../constants/possession'
import type { MasterItemDTO, PossessionName } from '../types/api'

/**
 * ポゼッションIDをマスタ名称へ解決する。
 *
 * @param possessionId - プレイヤーのポゼッションID。旧schemaでは未指定になり得る。
 * @param possessions - ID順のポゼッションマスタ。
 * @returns マスタに存在する正規のポゼッション名。未解決の場合は既定値。
 */
export const resolvePossessionName = (
  possessionId: number | undefined,
  possessions: readonly MasterItemDTO[]
): PossessionName => {
  if (possessionId == null) return DEFAULT_POSSESSION_NAME

  const name = possessions.find((item) => item.id === possessionId)?.name
  return name != null && isPossessionName(name) ? name : DEFAULT_POSSESSION_NAME
}
