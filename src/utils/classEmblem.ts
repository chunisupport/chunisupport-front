import type { MasterItemDTO } from '../types/api'

/**
 * クラスエンブレム関連のIDをマスタ名称へ解決する。
 *
 * @param id - プレイヤーのマスタID。未設定の場合は null。
 * @param masters - ID順のマスタ一覧。
 * @returns マスタ名称。未設定・未解決の場合は undefined。
 */
export const resolveClassEmblemName = (
  id: number | null,
  masters: readonly MasterItemDTO[]
): string | undefined => {
  if (id == null) return undefined

  return masters.find((item) => item.id === id)?.name
}
