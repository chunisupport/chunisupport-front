import { createSignal } from 'solid-js'
import type { FilterState } from '../types/recordFilter'

/** OVER POWER画面から通常レコード画面へ引き渡すフィルター。 */
export type PendingStandardRecordFilter = {
  username: string
  filter: FilterState
}

const [pendingStandardRecordFilter, setPendingStandardRecordFilter] =
  createSignal<PendingStandardRecordFilter | null>(null)

/** 通常レコード画面へ引き渡される未適用フィルターを返す。 */
export { pendingStandardRecordFilter }

/**
 * 通常レコード画面で適用するフィルターを公開する。
 *
 * @param username - フィルターを適用するユーザー名。
 * @param filter - 遷移先で適用するフィルター。
 * @returns 公開した引き渡しデータ。
 */
export const publishStandardRecordFilter = (
  username: string,
  filter: FilterState
): PendingStandardRecordFilter => {
  const pendingFilter = { username, filter }
  setPendingStandardRecordFilter(pendingFilter)
  return pendingFilter
}

/**
 * 適用済みのフィルター引き渡しデータを破棄する。
 *
 * @param appliedFilter - 適用を完了した引き渡しデータ。
 * @returns なし。
 */
export const consumeStandardRecordFilter = (appliedFilter: PendingStandardRecordFilter): void => {
  setPendingStandardRecordFilter((current) => (current === appliedFilter ? null : current))
}
