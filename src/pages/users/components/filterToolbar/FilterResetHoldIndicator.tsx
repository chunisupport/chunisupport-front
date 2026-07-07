import type { Component } from 'solid-js'
import { Show } from 'solid-js'

/** フィルターボタンの1辺。リングサイズ算出の基準に使う。 */
const FILTER_BUTTON_SIZE_REM = 2.375 / 2.0

/** フィルターボタンの対角線。 */
const FILTER_BUTTON_DIAGONAL_REM = FILTER_BUTTON_SIZE_REM * Math.SQRT2

/** 内側の濃いドーナツ円の外径。 */
const FILTER_RESET_INNER_RING_OUTER_SIZE_REM = FILTER_BUTTON_DIAGONAL_REM * 1.7 * 2

/** 内側の濃いドーナツ円の内径。 */
const FILTER_RESET_INNER_RING_INNER_SIZE_REM = FILTER_BUTTON_DIAGONAL_REM * 1.2 * 2

/** 外側の進行ドーナツ円の外径。 */
const FILTER_RESET_OUTER_RING_OUTER_SIZE_REM = FILTER_BUTTON_DIAGONAL_REM * 3.4 * 2

/** 外側の進行ドーナツ円の内径。 */
const FILTER_RESET_OUTER_RING_INNER_SIZE_REM = FILTER_BUTTON_DIAGONAL_REM * 1.9 * 2

/** リセットインジケータSVGのビューボックスサイズ。 */
const FILTER_RESET_INDICATOR_VIEWBOX_SIZE = 100

/** リセットインジケータSVGの中心座標。 */
const FILTER_RESET_INDICATOR_CENTER = FILTER_RESET_INDICATOR_VIEWBOX_SIZE / 2

/** 外側リングの外周半径。 */
const FILTER_RESET_OUTER_RING_OUTER_RADIUS = FILTER_RESET_INDICATOR_VIEWBOX_SIZE / 2

/** 外側リングの内周半径。 */
const FILTER_RESET_OUTER_RING_INNER_RADIUS =
  (FILTER_RESET_OUTER_RING_INNER_SIZE_REM / FILTER_RESET_OUTER_RING_OUTER_SIZE_REM) *
  FILTER_RESET_OUTER_RING_OUTER_RADIUS

/** 外側リングの線幅。 */
const FILTER_RESET_OUTER_RING_STROKE_WIDTH =
  FILTER_RESET_OUTER_RING_OUTER_RADIUS - FILTER_RESET_OUTER_RING_INNER_RADIUS

/** 外側リングの中心線半径。 */
const FILTER_RESET_OUTER_RING_RADIUS =
  FILTER_RESET_OUTER_RING_INNER_RADIUS + FILTER_RESET_OUTER_RING_STROKE_WIDTH / 2

/** 外側リングの円周。 */
const FILTER_RESET_OUTER_RING_CIRCUMFERENCE = 2 * Math.PI * FILTER_RESET_OUTER_RING_RADIUS

/** 内側リングの外周半径。 */
const FILTER_RESET_INNER_RING_OUTER_RADIUS =
  (FILTER_RESET_INNER_RING_OUTER_SIZE_REM / FILTER_RESET_OUTER_RING_OUTER_SIZE_REM) *
  FILTER_RESET_OUTER_RING_OUTER_RADIUS

/** 内側リングの内周半径。 */
const FILTER_RESET_INNER_RING_INNER_RADIUS =
  (FILTER_RESET_INNER_RING_INNER_SIZE_REM / FILTER_RESET_OUTER_RING_OUTER_SIZE_REM) *
  FILTER_RESET_OUTER_RING_OUTER_RADIUS

/** 内側リングの線幅。 */
const FILTER_RESET_INNER_RING_STROKE_WIDTH =
  FILTER_RESET_INNER_RING_OUTER_RADIUS - FILTER_RESET_INNER_RING_INNER_RADIUS

/** 内側リングの中心線半径。 */
const FILTER_RESET_INNER_RING_RADIUS =
  FILTER_RESET_INNER_RING_INNER_RADIUS + FILTER_RESET_INNER_RING_STROKE_WIDTH / 2

/** リセット操作中に外側リングの上へ表示する文言。 */
const FILTER_RESET_HOLDING_LABEL = 'フィルター・ソート リセット'

/** リセット可能になった後にリング内へ表示する文言。 */
const FILTER_RESET_READY_LABEL = 'RELEASE'

type FilterResetHoldIndicatorProps = {
  /** 長押し進捗。0から1の範囲で扱う。 */
  progress: number
  /** ボタン解放でリセットできる状態か。 */
  ready: boolean
}

/**
 * フィルターリセット用の長押し進捗リングを表示する。
 *
 * @param props - 長押し進捗とリセット可能状態。
 * @returns 長押し中だけツールバー上に重ねるインジケータ。
 */
const FilterResetHoldIndicator: Component<FilterResetHoldIndicatorProps> = (props) => {
  /**
   * 外側リングで表示する現在の円弧長を返す。
   *
   * @returns 長押し進捗に応じたSVG円周上の表示長。
   */
  const resetIndicatorArcLength = () => FILTER_RESET_OUTER_RING_CIRCUMFERENCE * props.progress

  /**
   * 外側リングの円弧開始角度をSVG座標系で返す。
   *
   * @returns ユーザー指定の角度定義をSVGの右始点へ変換した回転角。
   */
  const resetIndicatorArcStartRotation = () => 90 - 180 * props.progress

  return (
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: `${FILTER_RESET_OUTER_RING_OUTER_SIZE_REM}rem`,
        height: `${FILTER_RESET_OUTER_RING_OUTER_SIZE_REM}rem`,
      }}
    >
      <svg
        class="absolute inset-0 overflow-visible"
        viewBox={`0 0 ${FILTER_RESET_INDICATOR_VIEWBOX_SIZE} ${FILTER_RESET_INDICATOR_VIEWBOX_SIZE}`}
        aria-hidden="true"
        shape-rendering="geometricPrecision"
      >
        <circle
          cx={FILTER_RESET_INDICATOR_CENTER}
          cy={FILTER_RESET_INDICATOR_CENTER}
          r={FILTER_RESET_INNER_RING_RADIUS}
          fill="none"
          stroke="color-mix(in oklab, var(--cs-color-danger) 85%, transparent)"
          stroke-width={FILTER_RESET_INNER_RING_STROKE_WIDTH}
        />
        <circle
          cx={FILTER_RESET_INDICATOR_CENTER}
          cy={FILTER_RESET_INDICATOR_CENTER}
          r={FILTER_RESET_OUTER_RING_RADIUS}
          fill="none"
          stroke="color-mix(in oklab, var(--cs-color-danger) 40%, transparent)"
          stroke-width={FILTER_RESET_OUTER_RING_STROKE_WIDTH}
          stroke-dasharray={`${resetIndicatorArcLength()} ${FILTER_RESET_OUTER_RING_CIRCUMFERENCE}`}
          stroke-linecap="butt"
          transform={`rotate(${resetIndicatorArcStartRotation()} ${FILTER_RESET_INDICATOR_CENTER} ${FILTER_RESET_INDICATOR_CENTER})`}
        />
      </svg>
      <div class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded border border-danger-border bg-danger-bg px-3 py-2 text-md font-semibold text-danger shadow-md">
        {FILTER_RESET_HOLDING_LABEL}
      </div>
      <Show when={props.ready}>
        <div
          class="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xl font-bold text-text-inverse"
          style={{
            top: `0rem`,
            'text-shadow':
              '0 0 3px var(--cs-color-danger), 0 0 6px var(--cs-color-danger), 0 0 10px var(--cs-color-danger)',
          }}
        >
          {FILTER_RESET_READY_LABEL}
        </div>
      </Show>
    </div>
  )
}

export default FilterResetHoldIndicator
