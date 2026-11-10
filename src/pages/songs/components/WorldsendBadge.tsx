import { WORLDSEND_SCORE_LABEL } from '../../../constants/chart'

/**
 * WORLD'S END 譜面を表す共通バッジを表示する。
 *
 * @returns WORLD'S END のデザイントークンを適用したバッジ。
 */
const WorldsendBadge = () => (
  <span class="inline-flex items-center justify-center rounded bg-[image:var(--cs-color-worldsend-label-bg)] px-3 py-1 text-center text-xs font-semibold tracking-wide whitespace-nowrap text-worldsend-label-text">
    {WORLDSEND_SCORE_LABEL}
  </span>
)

export default WorldsendBadge
