import { createVirtualizer } from '@tanstack/solid-virtual'
import { createMemo, createSignal, onCleanup, onMount } from 'solid-js'

const DEFAULT_OVERSCAN = 12

const getScrollElement = () => document.getElementById('app-main') as HTMLDivElement | null

export const sortAriaValue = (
  active: boolean,
  direction: 'asc' | 'desc' | null
): 'ascending' | 'descending' | 'none' => {
  if (!active || !direction) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}

export const createVirtualizedSongsTable = (params: {
  getCount: () => number
  rowHeight: number
  resetOnCountChange?: boolean
}) => {
  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLTableSectionElement | undefined
  let layoutResizeObserver: ResizeObserver | undefined

  const [scrollMargin, setScrollMargin] = createSignal(0)

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    get count() {
      return params.getCount()
    },
    getScrollElement,
    estimateSize: () => params.rowHeight,
    overscan: DEFAULT_OVERSCAN,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  const updateScrollMargin = () => {
    const scrollElement = getScrollElement()
    const tableBodyElement = tableBodyRef
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

    if (tableContainerRef && typeof ResizeObserver !== 'undefined') {
      layoutResizeObserver = new ResizeObserver(() => {
        queueMicrotask(updateScrollMargin)
      })

      layoutResizeObserver.observe(tableContainerRef)

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

  const maybeResetScroll = () => {
    if (!params.resetOnCountChange) return
    queueMicrotask(() => {
      updateScrollMargin()
      rowVirtualizer.scrollToIndex(0)
    })
  }

  const virtualRows = createMemo(() =>
    rowVirtualizer.getVirtualItems().filter((virtualRow) => virtualRow.index < params.getCount())
  )

  return {
    setTableContainerRef: (el: HTMLDivElement | undefined) => {
      tableContainerRef = el
    },
    setTableBodyRef: (el: HTMLTableSectionElement | undefined) => {
      tableBodyRef = el
    },
    scrollMargin,
    virtualRows,
    getTotalSize: () => rowVirtualizer.getTotalSize(),
    resetToTop: () => {
      queueMicrotask(() => {
        updateScrollMargin()
        rowVirtualizer.scrollToIndex(0)
      })
    },
    maybeResetScroll,
  }
}
