import { createEffect, createMemo, For, type JSX } from 'solid-js'
import { createWindowVirtualTable } from '../../../components/common/createWindowVirtualTable'
import { getVirtualGridRowCount, getVirtualGridRowSlice } from '../../../utils/virtualGrid'
import {
  SONG_CARD_COLUMN_GAP_PX,
  SONG_CARD_GRID_OVERSCAN,
  SONG_CARD_ROW_HEIGHT_PX,
} from './songCardLayout.constants.ts'

type SongCardGridProps<T> = {
  items: readonly T[]
  columnCount: number
  initialScrollOffset?: number
  renderCard: (item: T) => JSX.Element
}

/**
 * 通常曲とWORLD'S ENDで共通の仮想行配置・スクロール制御を提供する。
 *
 * @param props - 表示対象、列数、初期スクロール位置と各カードの描画処理。
 * @returns 表示範囲のカードだけを描画するグリッド。
 */
const SongCardGrid = <T,>(props: SongCardGridProps<T>) => {
  const virtualizedGrid = createWindowVirtualTable<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement
  >({
    rowCount: () => getVirtualGridRowCount(props.items.length, props.columnCount),
    rowHeight: SONG_CARD_ROW_HEIGHT_PX,
    overscan: SONG_CARD_GRID_OVERSCAN,
    resetOnRowCountChange: false,
    initialOffset: props.initialScrollOffset,
    layoutDeps: () => props.columnCount,
  })

  const virtualRows = createMemo(() => virtualizedGrid.virtualRows())

  createEffect((previousCount?: number) => {
    const nextCount = props.items.length
    if (previousCount !== undefined && previousCount !== nextCount) {
      virtualizedGrid.resetToTop()
    }
    return nextCount
  })

  return (
    <div ref={virtualizedGrid.setTableContainerRef} class="w-full">
      <div
        ref={virtualizedGrid.setTableBodyRef}
        class="relative w-full"
        style={{
          height: `${virtualizedGrid.getTotalSize()}px`,
        }}
      >
        <For each={virtualRows()}>
          {(virtualRow) => {
            const rowSongs = createMemo(() =>
              getVirtualGridRowSlice(props.items, virtualRow.index, props.columnCount)
            )

            return (
              <div
                class="absolute top-0 left-0 grid"
                style={{
                  'grid-template-columns': `repeat(${props.columnCount}, minmax(0, 1fr))`,
                  width: '100%',
                  gap: `${SONG_CARD_COLUMN_GAP_PX}px`,
                  transform: `translateY(${virtualRow.start - virtualizedGrid.scrollMargin()}px)`,
                }}
              >
                <For each={rowSongs()}>{(song) => props.renderCard(song)}</For>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default SongCardGrid
