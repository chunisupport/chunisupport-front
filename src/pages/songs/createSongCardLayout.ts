import { createEffect, createMemo, createSignal, onCleanup } from 'solid-js'
import {
  getAvailableSongCardWidth,
  getSongCardContentWidth,
  resolveSongCardColumnCount,
} from './SongsCardList/utils/songCardGrid'

/**
 * カード一覧の表示幅を監視し、列数と本文幅を算出する。
 *
 * @returns 監視対象のref setter、カード列数、カード本文幅。
 */
export const createSongCardLayout = () => {
  const [availableWidth, setAvailableWidth] = createSignal(getAvailableSongCardWidth())
  const [frameElement, setFrameElement] = createSignal<HTMLDivElement>()
  const columnCount = createMemo(() => resolveSongCardColumnCount(availableWidth()))
  const contentWidth = createMemo(() => getSongCardContentWidth(availableWidth()))

  createEffect(() => {
    const element = frameElement()
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? element.clientWidth
      setAvailableWidth((current) => (current === width ? current : width))
    })
    observer.observe(element)
    onCleanup(() => {
      observer.disconnect()
    })
  })

  return {
    setFrameElement,
    columnCount,
    contentWidth,
  }
}
