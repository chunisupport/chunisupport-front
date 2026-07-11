import { useDragDropContext } from '@thisbeyond/solid-dnd'
import { onCleanup, onMount } from 'solid-js'

/** タッチ操作でドラッグ開始とみなす長押し時間（ms）。 */
const TOUCH_DRAG_ACTIVATION_DELAY_MS = 300

/** 長押し前にこの距離（px）以上動いたらスクロール操作として扱う。 */
const TOUCH_SCROLL_DISTANCE_THRESHOLD_PX = 10

/**
 * 目標カードのタッチ操作を長押しでドラッグへ切り替える solid-dnd センサーを登録する。
 *
 * 縦方向へ動かした場合はドラッグを開始せず、通常のページスクロールを優先する。
 *
 * @returns 描画要素なし。
 */
export function GoalsListLongPressSensor() {
  const context = useDragDropContext()
  if (!context) return null

  const [
    state,
    { addSensor, removeSensor, sensorStart, sensorMove, sensorEnd, dragStart, dragEnd },
  ] = context
  const sensorId = 'goals-list-long-press-sensor'
  let activationTimeoutId: number | undefined
  let activationDraggableId: number | string | undefined
  let activePointerId: number | undefined
  let initialCoordinates = { x: 0, y: 0 }

  /** ドラッグ開始待ちとドキュメントイベントを解除する。 */
  const detach = (): void => {
    if (activationTimeoutId !== undefined) {
      window.clearTimeout(activationTimeoutId)
      activationTimeoutId = undefined
    }
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    document.removeEventListener('pointercancel', handlePointerCancel)
    activationDraggableId = undefined
    activePointerId = undefined
  }

  /** 長押し完了後にドラッグ状態へ移行する。 */
  const activate = (): void => {
    if (state.active.sensor || activationDraggableId === undefined) return

    sensorStart(sensorId, initialCoordinates)
    dragStart(activationDraggableId)
  }

  /**
   * ポインター移動に応じて、スクロール優先の解除またはドラッグ位置更新を行う。
   *
   * @param event - ドキュメント上で発生したポインター移動イベント。
   * @returns なし。
   */
  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return

    if (!state.active.sensor) {
      const distance = Math.hypot(
        event.clientX - initialCoordinates.x,
        event.clientY - initialCoordinates.y
      )
      if (distance >= TOUCH_SCROLL_DISTANCE_THRESHOLD_PX) {
        detach()
      }
      return
    }

    event.preventDefault()
    sensorMove({ x: event.clientX, y: event.clientY })
  }

  /**
   * ポインターを離したとき、ドラッグを終了する。
   *
   * @param event - ドキュメント上で発生したポインター終了イベント。
   * @returns なし。
   */
  const handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return

    detach()
    if (state.active.sensorId !== sensorId) return

    event.preventDefault()
    dragEnd()
    sensorEnd()
  }

  /**
   * ブラウザがポインター操作をキャンセルしたとき、開始待ちまたはドラッグ状態を解除する。
   *
   * @returns なし。
   */
  const handlePointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== activePointerId) return

    detach()
    if (state.active.sensorId !== sensorId) return

    dragEnd()
    sensorEnd()
  }

  /**
   * ドラッグ開始を除外する操作要素かどうかを判定する。
   *
   * @param target - ポインター押下イベントの発生元。
   * @returns リンクやボタンなど、通常操作を優先する要素なら true。
   */
  const isDragExcludedTarget = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    target.closest('a, button, input, select, textarea, [data-no-dnd]') !== null

  /**
   * カードのポインター押下時に、ドラッグ開始待ちをセットする。
   *
   * @param event - カードで発生したポインター押下イベント。
   * @param draggableId - 押下されたカードのID。
   * @returns なし。
   */
  const attach = (event: PointerEvent, draggableId: number | string): void => {
    if (activePointerId !== undefined || event.button !== 0 || isDragExcludedTarget(event.target)) {
      return
    }

    activationDraggableId = draggableId
    activePointerId = event.pointerId
    initialCoordinates = { x: event.clientX, y: event.clientY }
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerCancel)
    activationTimeoutId = window.setTimeout(activate, TOUCH_DRAG_ACTIVATION_DELAY_MS)
  }

  onMount(() => {
    addSensor({ id: sensorId, activators: { pointerdown: attach } })
  })

  onCleanup(() => {
    if (state.active.sensorId === sensorId) {
      dragEnd()
      sensorEnd()
    }
    detach()
    removeSensor(sensorId)
  })

  return null
}
