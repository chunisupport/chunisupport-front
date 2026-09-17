import { DEFAULT_POSSESSION_NAME, isPossessionName } from '../constants/possession'
import type { MasterItemDTO, PossessionName } from '../types/api'

/**
 * 所持状況IDをマスタ名称へ解決する。
 *
 * @param possessionId - プレイヤーの所持状況ID。旧schemaでは未指定になり得る。
 * @param possessions - ID順の所持状況マスタ。
 * @returns マスタに存在する正規の所持状況名。未解決の場合は既定値。
 */
export const resolvePossessionName = (
  possessionId: number | undefined,
  possessions: readonly MasterItemDTO[]
): PossessionName => {
  if (possessionId == null) return DEFAULT_POSSESSION_NAME

  const name = possessions.find((item) => item.id === possessionId)?.name
  return name != null && isPossessionName(name) ? name : DEFAULT_POSSESSION_NAME
}
