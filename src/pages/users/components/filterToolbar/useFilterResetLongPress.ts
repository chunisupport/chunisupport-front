import { createSignal, onCleanup } from 'solid-js'

/** 単押しと長押しを判定するため、見た目を変えずに待つ時間 */
const FILTER_RESET_PRESS_JUDGE_MS = 320

/** リセット操作として扱う長押しインジケータの進行時間 */
const FILTER_RESET_INDICATOR_DURATION_MS = 400

/** フィルターリセットを実行可能にする合計長押し時間 */
const FILTER_RESET_HOLD_DURATION_MS =
  FILTER_RESET_PRESS_JUDGE_MS + FILTER_RESET_INDICATOR_DURATION_MS

/** 長押し成立後の互換クリックを抑止する時間 */
const FILTER_RESET_CLICK_SUPPRESSION_MS = 500

/** 長押し中に一時適用するテキスト選択抑止値 */
const FILTER_RESET_USER_SELECT_DISABLED_VALUE = 'none'

/** WebKit系ブラウザ向けのテキスト選択抑止プロパティ名 */
const FILTER_RESET_WEBKIT_USER_SELECT_PROPERTY = '-webkit-user-select'

type UseFilterResetLongPressParams = {
  /** 長押し判定を開始できない状態か */
  isDisabled: () => boolean
  /** 長押し成立後にポインターを離したときの処理 */
  onReset: () => void
  /** 通常クリック時の処理 */
  onClick: () => void
}

/**
 * フィルターボタンの通常クリックと長押しリセットを振り分ける。
 *
 * @param params - 無効状態、リセット処理、通常クリック処理。
 * @returns 長押し状態とフィルターボタンへ渡すイベントハンドラー。
 */
export const useFilterResetLongPress = (params: UseFilterResetLongPressParams) => {
  const [hintVisible, setHintVisible] = createSignal(false)
  const [progress, setProgress] = createSignal(0)
  const [ready, setReady] = createSignal(false)
  let pressStartedAt = 0
  let hintTimerId: number | undefined
  let readyTimerId: number | undefined
  let progressFrameId: number | undefined
  let suppressClickTimerId: number | undefined
  let previousBodyUserSelect = ''
  let previousBodyWebkitUserSelect = ''
  let textSelectionDisabled = false
  let pressing = false
  let suppressNextClick = false

  /**
   * 長押し中に発生するテキスト選択開始を抑止する。
   *
   * @param event - 文書上の選択開始イベント。
   * @returns なし。
   */
  const preventTextSelection = (event: Event) => {
    event.preventDefault()
  }

  /**
   * 長押し操作中だけページ全体のテキスト選択を無効化する。
   *
   * @returns なし。
   */
  const disableTextSelection = () => {
    if (textSelectionDisabled) return

    previousBodyUserSelect = document.body.style.userSelect
    previousBodyWebkitUserSelect = document.body.style.getPropertyValue(
      FILTER_RESET_WEBKIT_USER_SELECT_PROPERTY
    )
    document.body.style.userSelect = FILTER_RESET_USER_SELECT_DISABLED_VALUE
    document.body.style.setProperty(
      FILTER_RESET_WEBKIT_USER_SELECT_PROPERTY,
      FILTER_RESET_USER_SELECT_DISABLED_VALUE
    )
    document.addEventListener('selectstart', preventTextSelection)
    textSelectionDisabled = true
  }

  /**
   * 長押し操作中に無効化したテキスト選択を元に戻す。
   *
   * @returns なし。
   */
  const restoreTextSelection = () => {
    if (!textSelectionDisabled) return

    document.body.style.userSelect = previousBodyUserSelect
    document.body.style.setProperty(
      FILTER_RESET_WEBKIT_USER_SELECT_PROPERTY,
      previousBodyWebkitUserSelect
    )
    document.removeEventListener('selectstart', preventTextSelection)
    textSelectionDisabled = false
  }

  /**
   * 長押しゲージのアニメーションを現在時刻から再計算する。
   *
   * @param currentTime - requestAnimationFrame から渡される現在時刻。
   * @returns なし。
   */
  const updateProgress = (currentTime: number) => {
    if (!pressing) return

    const currentProgress =
      (currentTime - pressStartedAt - FILTER_RESET_PRESS_JUDGE_MS) /
      FILTER_RESET_INDICATOR_DURATION_MS
    const nextProgress = Math.min(Math.max(currentProgress, 0), 1)
    setProgress(nextProgress)

    if (nextProgress < 1) {
      progressFrameId = requestAnimationFrame(updateProgress)
    }
  }

  /**
   * 長押し表示とタイマーを停止する。
   *
   * @returns なし。
   */
  const stopPress = () => {
    pressing = false
    restoreTextSelection()
    setHintVisible(false)
    setProgress(0)
    setReady(false)

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
  const handlePointerDown = (event: PointerEvent & { currentTarget: HTMLButtonElement }) => {
    if (params.isDisabled() || event.button !== 0) return

    stopPress()
    pressing = true
    disableTextSelection()
    pressStartedAt = performance.now()
    event.currentTarget.setPointerCapture?.(event.pointerId)

    hintTimerId = window.setTimeout(() => {
      if (!pressing) return
      setHintVisible(true)
      setProgress(0)
      progressFrameId = requestAnimationFrame(updateProgress)
    }, FILTER_RESET_PRESS_JUDGE_MS)

    readyTimerId = window.setTimeout(() => {
      if (!pressing) return
      setReady(true)
      setProgress(1)
    }, FILTER_RESET_HOLD_DURATION_MS)
  }

  /**
   * フィルターボタンのポインター解放時に長押し操作を確定またはキャンセルする。
   *
   * @param event - フィルターボタンのポインター解放イベント。
   * @returns なし。
   */
  const handlePointerUp = (event: PointerEvent) => {
    const shouldReset = pressing && ready()
    const shouldSuppressClick = hintVisible()
    stopPress()

    if (!shouldSuppressClick) return

    suppressLongPressClick()
    event.preventDefault()

    if (shouldReset) {
      params.onReset()
    }
  }

  /**
   * フィルターボタンの通常クリックか長押し後クリックかを振り分ける。
   *
   * @param event - フィルターボタンのクリックイベント。
   * @returns なし。
   */
  const handleClick = (event: MouseEvent) => {
    if (suppressNextClick) {
      suppressNextClick = false
      if (suppressClickTimerId !== undefined) {
        window.clearTimeout(suppressClickTimerId)
        suppressClickTimerId = undefined
      }
      event.preventDefault()
      return
    }

    params.onClick()
  }

  onCleanup(() => {
    stopPress()

    if (suppressClickTimerId !== undefined) {
      window.clearTimeout(suppressClickTimerId)
    }
  })

  return {
    hintVisible,
    progress,
    ready,
    handleClick,
    handlePointerDown,
    handlePointerUp,
    stopPress,
  }
}
