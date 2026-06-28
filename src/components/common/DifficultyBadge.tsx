import type { PlayerDataDifficulty } from '../../types/api.ts'
import { getDifficultyBadgeWidthClass } from '../../utils/difficultyBadgeLayout.ts'
import { difficultyBadgeClass } from '../../utils/difficultyUtils.ts'

/**
 * 楽曲詳細と分析表で共通利用するフルテキストの難易度バッジ。
 *
 * @param props.difficulty - 表示する難易度。
 * @param props.compact - 表内向けの省スペース表示にするか。
 * @returns 難易度色とフルテキストを適用したバッジ。
 */
export const DifficultyBadge = (props: { difficulty: PlayerDataDifficulty; compact?: boolean }) => (
  <span
    class={`inline-flex items-center justify-center rounded text-center text-xs font-semibold tracking-wide whitespace-nowrap ${getDifficultyBadgeWidthClass(
      props.compact
    )} ${props.compact === true ? 'px-2 py-0.5' : 'px-3 py-1'} ${difficultyBadgeClass(
      props.difficulty
    )}`}
  >
    {props.difficulty}
  </span>
)
