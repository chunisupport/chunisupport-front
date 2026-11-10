import { useDragDropContext } from '@thisbeyond/solid-dnd'
import type { Component } from 'solid-js'
import { onCleanup } from 'solid-js'

/** Y軸制約に適用するtransformerのID */
const VERTICAL_AXIS_CONSTRAINT_ID = 'vertical-axis-constraint'

/**
 * ドラッグ変位をY軸だけに制限する。
 *
 * @returns 描画要素なし（ドラッグ中のtransformer登録のみ）。
 */
export const VerticalAxisConstraint: Component = () => {
  const context = useDragDropContext()
  if (!context) return null

  const [state, { addTransformer, removeTransformer, onDragStart, onDragEnd }] = context

  onDragStart(({ draggable }) => {
    addTransformer('draggables', draggable.id, {
      id: VERTICAL_AXIS_CONSTRAINT_ID,
      order: 10,
      callback: (transform) => ({ x: 0, y: transform.y }),
    })
  })

  onDragEnd(({ draggable }) => {
    removeTransformer('draggables', draggable.id, VERTICAL_AXIS_CONSTRAINT_ID)
  })

  onCleanup(() => {
    const draggableId = state.active.draggableId
    if (draggableId !== null) {
      removeTransformer('draggables', draggableId, VERTICAL_AXIS_CONSTRAINT_ID)
    }
  })

  return null
}
