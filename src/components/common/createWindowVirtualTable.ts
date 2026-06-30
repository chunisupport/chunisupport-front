import { createVirtualizer } from '@tanstack/solid-virtual'
import { type Accessor, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js'

const DEFAULT_OVERSCAN = 12

/**
 * アプリ全体のメインスクロール要素を取得する。
 *
 * @returns メインスクロール要素。未描画の場合はnull。
 */
const getDefaultScrollElement = () => document.getElementById('app-main') as HTMLDivElement | null

type WindowVirtualTableParams<TScrollElement extends HTMLElement> = {
  /** 表示対象の行数。 */
  rowCount: Accessor<number>
  /** 1行あたりの見積もり高さ。 */
  rowHeight: number
  /** 仮想化範囲の前後に追加描画する行数。 */
  overscan?: number
  /** 行数変更時に先頭へスクロールするか。 */
  resetOnRowCountChange?: boolean
  /** レイアウトだけを再計算したい依存値。 */
  layoutDeps?: Accessor<unknown>
  /** スクロール要素の取得処理。未指定時はapp-mainを使う。 */
  getScrollElement?: () => TScrollElement | null
}

/**
 * ページのメインスクロール領域内に置かれたテーブル/リストを仮想化する。
 *
 * @template TContainerElement - 横スクロールや外枠を持つコンテナ要素の型。
 * @template TBodyElement - 仮想行を配置する本文要素の型。
 * @template TScrollElement - スクロール要素の型。
 * @template TItemElement - 仮想行要素の型。
 * @param params - 行数、高さ、スクロール要素、再計算条件。
 * @returns ref setter、仮想行、スクロール余白、合計高さ、先頭スクロール処理。
 */
export const createWindowVirtualTable = <
  TContainerElement extends HTMLElement = HTMLDivElement,
  TBodyElement extends HTMLElement = HTMLElement,
  TScrollElement extends HTMLElement = HTMLDivElement,
  TItemElement extends HTMLElement = HTMLElement,
>(
  params: WindowVirtualTableParams<TScrollElement>
) => {
  let layoutResizeObserver: ResizeObserver | undefined
  const [containerRef, setContainerRef] = createSignal<TContainerElement>()
  const [bodyRef, setBodyRef] = createSignal<TBodyElement>()
  const [scrollMargin, setScrollMargin] = createSignal(0)
  const getScrollElement = (params.getScrollElement ??
    getDefaultScrollElement) as () => TScrollElement | null

  const rowVirtualizer = createVirtualizer<TScrollElement, TItemElement>({
    get count() {
      return params.rowCount()
    },
    getScrollElement,
    estimateSize: () => params.rowHeight,
    overscan: params.overscan ?? DEFAULT_OVERSCAN,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  /**
   * 本文要素のページ内位置から、仮想行のtranslateY補正値を更新する。
   *
   * @returns なし。
   */
  const updateScrollMargin = () => {
    const scrollElement = getScrollElement()
    const tableBodyElement = bodyRef()
    if (!scrollElement || !tableBodyElement) return

    const scrollRect = scrollElement.getBoundingClientRect()
    const tableBodyRect = tableBodyElement.getBoundingClientRect()
    const next = tableBodyRect.top - scrollRect.top + scrollElement.scrollTop
    if (Math.abs(next - scrollMargin()) >= 1) {
      setScrollMargin(next)
    }
  }

  /**
   * レイアウト再計算後に先頭行へスクロールする。
   *
   * @returns なし。
   */
  const resetToTop = () => {
    queueMicrotask(() => {
      updateScrollMargin()
      rowVirtualizer.scrollToIndex(0)
    })
  }

  createEffect(() => {
    const containerElement = containerRef()
    const scrollElement = getScrollElement()

    updateScrollMargin()
    layoutResizeObserver?.disconnect()

    if (!containerElement || typeof ResizeObserver === 'undefined') return

    layoutResizeObserver = new ResizeObserver(() => {
      queueMicrotask(updateScrollMargin)
    })

    layoutResizeObserver.observe(containerElement)

    if (scrollElement) {
      layoutResizeObserver.observe(scrollElement)
    }
  })

  createEffect(() => {
    if (!params.resetOnRowCountChange) return
    params.rowCount()
    resetToTop()
  })

  createEffect(() => {
    params.layoutDeps?.()
    queueMicrotask(updateScrollMargin)
  })

  onMount(() => {
    updateScrollMargin()
    window.addEventListener('resize', updateScrollMargin)
  })

  onCleanup(() => {
    layoutResizeObserver?.disconnect()
    window.removeEventListener('resize', updateScrollMargin)
  })

  const virtualRows = createMemo(() =>
    rowVirtualizer.getVirtualItems().filter((virtualRow) => virtualRow.index < params.rowCount())
  )

  return {
    setTableContainerRef: (el: TContainerElement | undefined) => {
      setContainerRef(() => el)
    },
    setTableBodyRef: (el: TBodyElement | undefined) => {
      setBodyRef(() => el)
    },
    scrollMargin,
    virtualRows,
    getTotalSize: () => rowVirtualizer.getTotalSize(),
    resetToTop,
  }
}
