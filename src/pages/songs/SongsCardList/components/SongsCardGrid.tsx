import { createEffect, createMemo, createSignal, For, onCleanup, onMount } from 'solid-js'
import { createWindowVirtualTable } from '../../../../components/common/createWindowVirtualTable'
import type { SongDTO } from '../../../../types/api'
import {
  SONG_CARD_COLUMN_GAP_PX,
  SONG_CARD_GRID_OVERSCAN,
  SONG_CARD_PAGE_HORIZONTAL_PADDING_PX,
  SONG_CARD_ROW_HEIGHT_PX,
  SONG_CARD_WIDTH_PX,
} from '../constants'
import {
  getSongCardRowCount,
  getSongCardRowSlice,
  resolveSongCardColumnCount,
} from '../utils/songCardGrid'
import SongCard from './SongCard'

type SongsCardGridProps = {
  songs: SongDTO[]
  /** 仮想グリッド初回アタッチ時のスクロール位置 */
  initialScrollOffset?: number
}

/**
 * カードグリッドの初期列数をメイン領域の幅から決める。
 *
 * @returns 1列以上の列数。
 */
const readInitialColumnCount = (): number => {
  if (typeof document === 'undefined') return 1
  const main = document.getElementById('app-main')
  const width = (main?.clientWidth ?? 0) - SONG_CARD_PAGE_HORIZONTAL_PADDING_PX
  return resolveSongCardColumnCount(width)
}

/**
 * 通常楽曲カードを仮想化したレスポンシブグリッドとして表示する。
 *
 * @param props - 表示する楽曲と初期スクロール位置。
 * @returns 仮想スクロールするカードグリッド。
 */
const SongsCardGrid = (props: SongsCardGridProps) => {
  const [columnCount, setColumnCount] = createSignal(readInitialColumnCount())
  const [containerEl, setContainerEl] = createSignal<HTMLDivElement>()

  const virtualizedGrid = createWindowVirtualTable<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement
  >({
    rowCount: () => getSongCardRowCount(props.songs.length, columnCount()),
    rowHeight: SONG_CARD_ROW_HEIGHT_PX,
    overscan: SONG_CARD_GRID_OVERSCAN,
    resetOnRowCountChange: false,
    initialOffset: props.initialScrollOffset,
    layoutDeps: columnCount,
  })

  const virtualRows = createMemo(() => virtualizedGrid.virtualRows())

  const setGridContainerRef = (element: HTMLDivElement | undefined) => {
    virtualizedGrid.setTableContainerRef(element)
    setContainerEl(() => element)
  }

  createEffect((previousCount?: number) => {
    const nextCount = props.songs.length
    if (previousCount !== undefined && previousCount !== nextCount) {
      virtualizedGrid.resetToTop()
    }
    return nextCount
  })

  createEffect(() => {
    const element = containerEl()
    if (!element || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? element.clientWidth
      const next = resolveSongCardColumnCount(width)
      setColumnCount((current) => (current === next ? current : next))
    })
    observer.observe(element)
    onCleanup(() => {
      observer.disconnect()
    })
  })

  onMount(() => {
    const element = containerEl()
    if (!element) return
    setColumnCount(resolveSongCardColumnCount(element.clientWidth))
  })

  return (
    <div ref={setGridContainerRef}>
      <div
        ref={virtualizedGrid.setTableBodyRef}
        class="relative w-full"
        style={{ height: `${virtualizedGrid.getTotalSize()}px` }}
      >
        <For each={virtualRows()}>
          {(virtualRow) => {
            const rowSongs = createMemo(() =>
              getSongCardRowSlice(props.songs, virtualRow.index, columnCount())
            )

            return (
              <div
                class="absolute top-0 left-0 grid w-full"
                style={{
                  'grid-template-columns': `repeat(${columnCount()}, ${SONG_CARD_WIDTH_PX}px)`,
                  gap: `${SONG_CARD_COLUMN_GAP_PX}px`,
                  transform: `translateY(${virtualRow.start - virtualizedGrid.scrollMargin()}px)`,
                }}
              >
                <For each={rowSongs()}>{(song) => <SongCard song={song} />}</For>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default SongsCardGrid
