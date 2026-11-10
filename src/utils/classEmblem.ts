/** クラスエンブレム・ベースのマスタ名。マスタIDは登録順（1始まり）でこの並びに対応する。 */
const CLASS_EMBLEM_MASTER_NAMES = ['1', '2', '3', '4', '5', 'inf'] as const

/**
 * クラスエンブレム（またはベース）のマスタIDをマスタ名へ解決する。
 *
 * @param id - `class_emblem_id` / `class_emblem_base_id`。未設定の場合は null。
 * @returns マスタ名。未設定または未対応のIDの場合は null。
 */
export const resolveClassEmblemMasterName = (id: number | null): string | null =>
  id === null ? null : (CLASS_EMBLEM_MASTER_NAMES[id - 1] ?? null)
