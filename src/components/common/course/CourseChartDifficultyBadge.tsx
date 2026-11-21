import { Show } from 'solid-js'
import { WORLDSEND_SCORE_LABEL, WORLDSEND_SHORT_LABEL } from '../../../constants/chart'
import type { CourseChartDifficulty } from '../../../types/api'
import { RECORD_COMPACT_BADGE_CLASS, RecordDifficultyBadge } from '../record/RecordBadges'

/**
 * コース譜面の難易度を表示する。
 *
 * @param props - 通常難易度またはWORLD'S END。
 * @returns 通常譜面と同じ寸法・視認性で統一した難易度バッジ。
 */
export const CourseChartDifficultyBadge = (props: { difficulty: CourseChartDifficulty }) => (
  <Show
    when={props.difficulty !== 'WORLDSEND' && props.difficulty}
    fallback={
      <span
        class={`${RECORD_COMPACT_BADGE_CLASS} bg-[image:var(--cs-color-worldsend-label-bg)] text-xs text-worldsend-label-text text-shadow-badge`}
      >
        <span aria-hidden="true">{WORLDSEND_SHORT_LABEL}</span>
        <span class="sr-only">{WORLDSEND_SCORE_LABEL}</span>
      </span>
    }
  >
    {(difficulty) => <RecordDifficultyBadge difficulty={difficulty()} />}
  </Show>
)
