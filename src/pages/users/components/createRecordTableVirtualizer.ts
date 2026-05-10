import { createVirtualizer } from '@tanstack/solid-virtual'
import { type Accessor, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'

type Params = {
  rowHeight: number
  rowCount: Accessor<number>
  containerRef: Accessor<HTMLDivElement | undefined>
  bodyRef: Accessor<HTMLDivElement | undefined>
  resetDeps?: Accessor<unknown>
}

export const createRecordTableVirtualizer = (params: Params) => {
  let layoutResizeObserver: ResizeObserver | undefined

  const getScrollElement = () => document.getElementById('app-main') as HTMLDivElement | null
  const [scrollMargin, setScrollMargin] = createSignal(0)

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    get count() {
      return params.rowCount()
    },
    getScrollElement,
    estimateSize: () => params.rowHeight,
    overscan: 12,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  const updateScrollMargin = () => {
    const scrollElement = getScrollElement()
    const tableBodyElement = params.bodyRef()
    if (!scrollElement || !tableBodyElement) return

    const scrollRect = scrollElement.getBoundingClientRect()
    const tableBodyRect = tableBodyElement.getBoundingClientRect()
    const next = tableBodyRect.top - scrollRect.top + scrollElement.scrollTop
    if (Math.abs(next - scrollMargin()) >= 1) {
      setScrollMargin(next)
    }
  }

  onMount(() => {
    updateScrollMargin()

    const container = params.containerRef()
    if (container && typeof ResizeObserver !== 'undefined') {
      layoutResizeObserver = new ResizeObserver(() => {
        queueMicrotask(updateScrollMargin)
      })

      layoutResizeObserver.observe(container)

      const scrollElement = getScrollElement()
      if (scrollElement) {
        layoutResizeObserver.observe(scrollElement)
      }
    }

    window.addEventListener('resize', updateScrollMargin)
  })

  onCleanup(() => {
    layoutResizeObserver?.disconnect()
    window.removeEventListener('resize', updateScrollMargin)
  })

  createEffect(() => {
    params.rowCount()
    queueMicrotask(() => {
      updateScrollMargin()
      rowVirtualizer.scrollToIndex(0)
    })
  })

  createEffect(() => {
    params.resetDeps?.()
    queueMicrotask(updateScrollMargin)
    requestAnimationFrame(updateScrollMargin)
  })

  const virtualRows = createMemo(() =>
    rowVirtualizer.getVirtualItems().filter((virtualRow) => virtualRow.index < params.rowCount())
  )

  return {
    virtualRows,
    scrollMargin,
    getTotalSize: () => rowVirtualizer.getTotalSize(),
  }
}
