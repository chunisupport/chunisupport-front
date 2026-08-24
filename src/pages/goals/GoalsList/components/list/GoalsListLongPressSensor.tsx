import { useDragDropContext } from '@thisbeyond/solid-dnd'
import { onCleanup, onMount } from 'solid-js'

/** タッチ操作でドラッグ開始とみなす長押し時間（ms） */
const TOUCH_DRAG_ACTIVATION_DELAY_MS = 300

/** 長押し前にこの距離（px）以上動いたらスクロール操作として扱う */
const TOUCH_SCROLL_DISTANCE_THRESHOLD_PX = 10

type ActiveInput = { type: 'pointer'; pointerId: number } | { type: 'touch'; identifier: number }

/**
 * 目標カードを長押しでドラッグへ切り替える solid-dnd センサーを登録する。
 *
 * タッチ操作では、長押し前に指が動けば通常スクロールを優先し、長押し成立後の
 * touchmove だけをドラッグ操作として扱う。
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
  let activeInput: ActiveInput | undefined
  let initialCoordinates = { x: 0, y: 0 }

  /** ドラッグ開始待ちとドキュメントイベントを解除する */
  const detach = (): void => {
    if (activationTimeoutId !== undefined) {
      window.clearTimeout(activationTimeoutId)
      activationTimeoutId = undefined
    }
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)
    document.removeEventListener('pointercancel', handlePointerCancel)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchstart', handleAdditionalTouch)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('touchcancel', handleTouchCancel)
    activationDraggableId = undefined
    activeInput = undefined
  }

  /** 長押し完了後にドラッグ状態へ移行する */
  const activate = (): void => {
    if (state.active.sensor || activationDraggableId === undefined) return

    sensorStart(sensorId, initialCoordinates)
    dragStart(activationDraggableId)
  }

  /**
   * 指定した識別子のタッチ点を取得する。
   *
   * @param touches - 検索対象のタッチ点一覧。
   * @param identifier - 追跡中のタッチ識別子。
   * @returns 一致するタッチ点。存在しなければ undefined。
   */
  const findTouch = (touches: TouchList, identifier: number): Touch | undefined => {
    for (let index = 0; index < touches.length; index += 1) {
      const touch = touches.item(index)
      if (touch?.identifier === identifier) return touch
    }
    return undefined
  }

  /**
   * 長押し成立前の移動距離がスクロール判定の閾値に達したか判定する。
   *
   * @param clientX - 現在のX座標。
   * @param clientY - 現在のY座標。
   * @returns スクロール操作として扱う距離なら true。
   */
  const movedBeforeActivation = (clientX: number, clientY: number): boolean =>
    Math.hypot(clientX - initialCoordinates.x, clientY - initialCoordinates.y) >=
    TOUCH_SCROLL_DISTANCE_THRESHOLD_PX

  /**
   * ポインター移動に応じて、スクロール優先の解除またはドラッグ位置更新を行う。
   *
   * @param event - ドキュメント上で発生したポインター移動イベント。
   * @returns なし。
   */
  const handlePointerMove = (event: PointerEvent): void => {
    if (activeInput?.type !== 'pointer' || event.pointerId !== activeInput.pointerId) return

    if (!state.active.sensor) {
      if (movedBeforeActivation(event.clientX, event.clientY)) detach()
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
    if (activeInput?.type !== 'pointer' || event.pointerId !== activeInput.pointerId) return

    detach()
    if (state.active.sensorId !== sensorId) return

    event.preventDefault()
    dragEnd()
    sensorEnd()
  }

  /**
   * ブラウザがポインター操作をキャンセルしたとき、待機またはドラッグ状態を解除する。
   *
   * @param event - キャンセルされたポインターイベント。
   * @returns なし。
   */
  const handlePointerCancel = (event: PointerEvent): void => {
    if (activeInput?.type !== 'pointer' || event.pointerId !== activeInput.pointerId) return

    detach()
    if (state.active.sensorId !== sensorId) return

    dragEnd()
    sensorEnd()
  }

  /**
   * タッチ移動をスクロールまたは長押し成立後のドラッグとして処理する。
   *
   * @param event - ドキュメント上で発生したタッチ移動イベント。
   * @returns なし。
   */
  const handleTouchMove = (event: TouchEvent): void => {
    if (activeInput?.type !== 'touch') return
    const touch = findTouch(event.touches, activeInput.identifier)
    if (!touch) return

    if (!state.active.sensor) {
      if (movedBeforeActivation(touch.clientX, touch.clientY)) {
        detach()
      } else {
        event.preventDefault()
      }
      return
    }

    event.preventDefault()
    sensorMove({ x: touch.clientX, y: touch.clientY })
  }

  /**
   * 2本目以降の指が触れた場合、長押し待機またはドラッグを解除する。
   *
   * @param event - ドキュメント上で発生した追加のタッチ開始イベント。
   * @returns なし。
   */
  const handleAdditionalTouch = (event: TouchEvent): void => {
    if (activeInput?.type !== 'touch' || event.touches.length === 1) return

    if (state.active.sensorId === sensorId) {
      dragEnd()
      sensorEnd()
    }
    detach()
  }

  /**
   * 追跡中の指を離したとき、ドラッグを終了する。
   *
   * @param event - ドキュメント上で発生したタッチ終了イベント。
   * @returns なし。
   */
  const handleTouchEnd = (event: TouchEvent): void => {
    if (activeInput?.type !== 'touch') return
    const touch = findTouch(event.changedTouches, activeInput.identifier)
    if (!touch) return

    detach()
    if (state.active.sensorId !== sensorId) return

    event.preventDefault()
    dragEnd()
    sensorEnd()
  }

  /**
   * 追跡中のタッチ操作がキャンセルされたとき、待機またはドラッグ状態を解除する。
   *
   * @param event - キャンセルされたタッチイベント。
   * @returns なし。
   */
  const handleTouchCancel = (event: TouchEvent): void => {
    if (activeInput?.type !== 'touch') return
    const touch = findTouch(event.changedTouches, activeInput.identifier)
    if (!touch) return

    detach()
    if (state.active.sensorId !== sensorId) return

    dragEnd()
    sensorEnd()
  }

  /**
   * ドラッグ開始を除外する操作要素かどうかを判定する。
   *
   * @param target - 押下イベントの発生元。
   * @returns リンクやボタンなど、通常操作を優先する要素なら true。
   */
  const isDragExcludedTarget = (target: EventTarget | null): boolean =>
    target instanceof Element &&
    target.closest('a, button, input, select, textarea, [data-no-dnd]') !== null

  /**
   * 共通の座標とカードIDを保持し、長押し開始待ちをセットする。
   *
   * @param draggableId - 押下されたカードのID。
   * @param clientX - 押下位置のX座標。
   * @param clientY - 押下位置のY座標。
   * @returns なし。
   */
  const startActivation = (
    draggableId: number | string,
    clientX: number,
    clientY: number
  ): void => {
    activationDraggableId = draggableId
    initialCoordinates = { x: clientX, y: clientY }
    activationTimeoutId = window.setTimeout(activate, TOUCH_DRAG_ACTIVATION_DELAY_MS)
  }

  /**
   * マウス・ペンの押下時にドラッグ開始待ちをセットする。
   *
   * @param event - カードで発生したポインター押下イベント。
   * @param draggableId - 押下されたカードのID。
   * @returns なし。
   */
  const attachPointer = (event: PointerEvent, draggableId: number | string): void => {
    if (
      event.pointerType === 'touch' ||
      activeInput !== undefined ||
      event.button !== 0 ||
      isDragExcludedTarget(event.target)
    ) {
      return
    }

    activeInput = { type: 'pointer', pointerId: event.pointerId }
    startActivation(draggableId, event.clientX, event.clientY)
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
    document.addEventListener('pointercancel', handlePointerCancel)
  }

  /**
   * タッチ開始時にドラッグ開始待ちをセットする。
   *
   * @param event - カードで発生したタッチ開始イベント。
   * @param draggableId - 押下されたカードのID。
   * @returns なし。
   */
  const attachTouch = (event: TouchEvent, draggableId: number | string): void => {
    if (activeInput !== undefined || isDragExcludedTarget(event.target)) return
    const touch = event.changedTouches.item(0)
    if (!touch) return

    activeInput = { type: 'touch', identifier: touch.identifier }
    startActivation(draggableId, touch.clientX, touch.clientY)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchstart', handleAdditionalTouch)
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchCancel)
  }

  onMount(() => {
    addSensor({
      id: sensorId,
      activators: { pointerdown: attachPointer, touchstart: attachTouch },
    })
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
