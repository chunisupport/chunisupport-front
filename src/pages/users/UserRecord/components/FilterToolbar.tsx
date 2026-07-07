import { Button } from '@kobalte/core/button'
import { ArrowUpDown, Columns3, Funnel } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, onCleanup, Show } from 'solid-js'
import { AppIconButton } from '../../../../components/common/AppButton'
import { SearchTextField } from '../../../../components/common/SearchTextField'

type FilterButtonTone = 'default' | 'active' | 'difficulty-only' | 'danger'

/** 単押しと長押しを判定するため、見た目を変えずに待つ時間。 */
const FILTER_RESET_PRESS_JUDGE_MS = 320

/** リセット操作として扱う長押しインジケータの進行時間。 */
const FILTER_RESET_INDICATOR_DURATION_MS = 400

/** フィルターリセットを実行可能にする合計長押し時間。 */
const FILTER_RESET_HOLD_DURATION_MS =
  FILTER_RESET_PRESS_JUDGE_MS + FILTER_RESET_INDICATOR_DURATION_MS

/** 長押し成立後の互換クリックを抑止する時間。 */
const FILTER_RESET_CLICK_SUPPRESSION_MS = 500

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

type FilterToolbarProps = {
  title: string
  onTitleChange: (value: string) => void
  onOpenFilter: () => void
  onResetFilter: () => void
  onOpenSortSettings: () => void
  onOpenColumnSettings: () => void
  titleActive?: boolean
  filterActive?: boolean
  filterButtonTone?: FilterButtonTone
  filterButtonDisabled?: boolean
}

/**
 * フィルター状態に応じたボタンクラスを返す。
 *
 * @param tone - フィルターボタンの強調状態。
 * @returns フィルターボタンへ適用する Tailwind クラス。
 */
const getFilterButtonToneClass = (tone: FilterButtonTone): string => {
  if (tone === 'active') {
    return 'border-action-primary bg-action-primary text-text-inverse hover:bg-action-primary-hover'
  }

  if (tone === 'difficulty-only') {
    return 'border-action-primary bg-action-primary-muted text-action-primary hover:bg-action-primary-muted'
  }

  if (tone === 'danger') {
    return 'border-danger bg-danger text-text-inverse hover:bg-danger-hover'
  }

  return 'border-border-strong bg-surface text-text-muted hover:bg-surface-hover'
}

/**
 * レコード一覧の検索欄とフィルター操作ボタンを表示する。
 *
 * @param props - 検索文字列、変更ハンドラー、フィルター・ソート・列設定の操作状態。
 * @returns レコード一覧上部のフィルターツールバー。
 */
const FilterToolbar: Component<FilterToolbarProps> = (props) => {
  const [resetHintVisible, setResetHintVisible] = createSignal(false)
  const [resetProgress, setResetProgress] = createSignal(0)
  const [resetReady, setResetReady] = createSignal(false)
  let pressStartedAt = 0
  let hintTimerId: number | undefined
  let readyTimerId: number | undefined
  let progressFrameId: number | undefined
  let suppressClickTimerId: number | undefined
  let pressing = false
  let suppressNextClick = false

  const filterButtonTone = () =>
    props.filterButtonTone ?? (props.filterActive ? 'active' : 'default')

  const filterButtonVisualTone = () => (resetHintVisible() ? 'danger' : filterButtonTone())

  /**
   * フィルター状態に応じたボタン表示名を返す。
   *
   * @returns フィルターボタンに付与するアクセシブル名。
   */
  const filterButtonLabel = () =>
    filterButtonTone() === 'default' ? 'フィルター' : 'フィルター適用中'

  /**
   * 長押しゲージのアニメーションを現在時刻から再計算する。
   *
   * @param currentTime - requestAnimationFrame から渡される現在時刻。
   * @returns なし。
   */
  const updateResetProgress = (currentTime: number) => {
    if (!pressing) return

    const progress =
      (currentTime - pressStartedAt - FILTER_RESET_PRESS_JUDGE_MS) /
      FILTER_RESET_INDICATOR_DURATION_MS
    const nextProgress = Math.min(Math.max(progress, 0), 1)
    setResetProgress(nextProgress)

    if (nextProgress < 1) {
      progressFrameId = requestAnimationFrame(updateResetProgress)
    }
  }

  /**
   * 長押し表示とタイマーを停止する。
   *
   * @returns なし。
   */
  const stopFilterResetPress = () => {
    pressing = false
    setResetHintVisible(false)
    setResetProgress(0)
    setResetReady(false)

    if (hintTimerId !== undefined) {
      window.clearTimeout(hintTimerId)
      hintTimerId = undefined
    }

    if (readyTimerId !== undefined) {
      window.clearTimeout(readyTimerId)
      readyTimerId = undefined
    }

    if (progressFrameId !== undefined) {
      cancelAnimationFrame(progressFrameId)
      progressFrameId = undefined
    }
  }

  /**
   * 長押し直後に発生する click だけを抑止対象として登録する。
   *
   * @returns なし。
   */
  const suppressLongPressClick = () => {
    suppressNextClick = true

    if (suppressClickTimerId !== undefined) {
      window.clearTimeout(suppressClickTimerId)
    }

    suppressClickTimerId = window.setTimeout(() => {
      suppressNextClick = false
      suppressClickTimerId = undefined
    }, FILTER_RESET_CLICK_SUPPRESSION_MS)
  }

  /**
   * フィルターボタンの長押し判定を開始する。
   *
   * @param event - フィルターボタンのポインター押下イベント。
   * @returns なし。
   */
  const handleFilterPointerDown = (event: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    if (props.filterButtonDisabled || event.button !== 0) return

    stopFilterResetPress()
    pressing = true
    pressStartedAt = performance.now()
    event.currentTarget.setPointerCapture(event.pointerId)

    hintTimerId = window.setTimeout(() => {
      if (!pressing) return
      setResetHintVisible(true)
      setResetProgress(0)
      progressFrameId = requestAnimationFrame(updateResetProgress)
    }, FILTER_RESET_PRESS_JUDGE_MS)

    readyTimerId = window.setTimeout(() => {
      if (!pressing) return
      setResetReady(true)
      setResetProgress(1)
    }, FILTER_RESET_HOLD_DURATION_MS)
  }

  /**
   * フィルターボタンのポインター解放時に長押し操作を確定またはキャンセルする。
   *
   * @param event - フィルターボタンのポインター解放イベント。
   * @returns なし。
   */
  const handleFilterPointerUp = (event: PointerEvent) => {
    const shouldReset = pressing && resetReady()
    const shouldSuppressClick = resetHintVisible()
    stopFilterResetPress()

    if (!shouldSuppressClick) return

    suppressLongPressClick()
    event.preventDefault()

    if (shouldReset) {
      props.onResetFilter()
    }
  }

  /**
   * フィルターボタンの通常クリックか長押し後クリックかを振り分ける。
   *
   * @param event - フィルターボタンのクリックイベント。
   * @returns なし。
   */
  const handleFilterClick = (event: MouseEvent) => {
    if (suppressNextClick) {
      suppressNextClick = false
      if (suppressClickTimerId !== undefined) {
        window.clearTimeout(suppressClickTimerId)
        suppressClickTimerId = undefined
      }
      event.preventDefault()
      return
    }

    props.onOpenFilter()
  }

  /**
   * 外側リングで表示する現在の円弧長を返す。
   *
   * @returns 長押し進捗に応じたSVG円周上の表示長。
   */
  const resetIndicatorArcLength = () => FILTER_RESET_OUTER_RING_CIRCUMFERENCE * resetProgress()

  /**
   * 外側リングの円弧開始角度をSVG座標系で返す。
   *
   * @returns ユーザー指定の角度定義をSVGの右始点へ変換した回転角。
   */
  const resetIndicatorArcStartRotation = () => 90 - 180 * resetProgress()

  onCleanup(() => {
    stopFilterResetPress()

    if (suppressClickTimerId !== undefined) {
      window.clearTimeout(suppressClickTimerId)
    }
  })

  return (
    <div class="flex items-center mb-2">
      <SearchTextField
        class="min-w-0 flex-1"
        frameClass="rounded-l"
        value={props.title}
        onChange={props.onTitleChange}
        active={Boolean(props.titleActive)}
        ariaLabel="曲名・アーティスト名検索"
        placeholder="曲名・アーティスト名で検索"
      />
      <div class="-ml-px relative shrink-0">
        <Show when={resetHintVisible()}>
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
            <div class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap bg-danger-bg rounded border border-danger-border px-3 py-2 text-md font-semibold text-danger shadow-md">
              {FILTER_RESET_HOLDING_LABEL}
            </div>
            <Show when={resetReady()}>
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
        </Show>
        <Button
          class={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-r border transition-colors focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-strong disabled:text-disabled-text disabled:hover:bg-transparent ${getFilterButtonToneClass(
            filterButtonVisualTone()
          )}`}
          onClick={handleFilterClick}
          onPointerDown={handleFilterPointerDown}
          onPointerUp={handleFilterPointerUp}
          onPointerCancel={stopFilterResetPress}
          type="button"
          aria-label={filterButtonLabel()}
          aria-pressed={filterButtonTone() !== 'default'}
          title={filterButtonLabel()}
          disabled={props.filterButtonDisabled}
        >
          <Funnel size={24} aria-hidden="true" />
        </Button>
      </div>
      <AppIconButton
        class="ml-2 h-9.5 w-9.5"
        onClick={props.onOpenSortSettings}
        aria-label="ソート"
        title="ソート"
      >
        <ArrowUpDown size={24} aria-hidden="true" />
      </AppIconButton>
      <AppIconButton
        class="ml-2 h-9.5 w-9.5"
        onClick={props.onOpenColumnSettings}
        aria-label="列設定"
        title="列設定"
      >
        <Columns3 size={24} />
      </AppIconButton>
    </div>
  )
}

export default FilterToolbar
