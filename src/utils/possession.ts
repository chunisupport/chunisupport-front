import { DEFAULT_POSSESSION_NAME, isPossessionName } from '../constants/possession'
import type { PossessionName } from '../types/api'

/**
 * APIから受け取ったポゼッション名を正規の名称へ正規化する。
 *
 * @param possession - APIが返すポゼッション名。未連携などで未指定になり得る。
 * @returns 正規のポゼッション名。未指定または想定外の値の場合は既定値。
 */
export const normalizePossessionName = (possession: string | null | undefined): PossessionName =>
  possession != null && isPossessionName(possession) ? possession : DEFAULT_POSSESSION_NAME
