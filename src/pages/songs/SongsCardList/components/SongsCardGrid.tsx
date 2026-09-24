import { createEffect, createMemo, For } from 'solid-js'
import { createWindowVirtualTable } from '../../../../components/common/createWindowVirtualTable'
import type { SongDTO, VersionSummaryDTO } from '../../../../types/api'
import { getVirtualGridRowCount, getVirtualGridRowSlice } from '../../../../utils/virtualGrid'
import {
  SONG_CARD_COLUMN_GAP_PX,
  SONG_CARD_GRID_OVERSCAN,
  SONG_CARD_ROW_HEIGHT_PX,
} from '../constants'
import SongCard from './SongCard'

type SongsCardGridProps = {
  songs: SongDTO[]
  /** 追加日からのバージョン解決に使う一覧 */
  versions: readonly VersionSummaryDTO[]
  /** 1行あたりの列数 */
  columnCount: number
  /** 仮想グリッド初回アタッチ時のスクロール位置 */
  initialScrollOffset?: number
}

/**
 * 通常楽曲カードを仮想化したグリッドとして表示する。
 *
 * @param props - 表示する楽曲、バージョン一覧、列数、初期スクロール位置。
 * @returns 仮想スクロールするカードグリッド。
 */
const SongsCardGrid = (props: SongsCardGridProps) => {
  const virtualizedGrid = createWindowVirtualTable<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement
  >({
    rowCount: () => getVirtualGridRowCount(props.songs.length, props.columnCount),
    rowHeight: SONG_CARD_ROW_HEIGHT_PX,
    overscan: SONG_CARD_GRID_OVERSCAN,
    resetOnRowCountChange: false,
    initialOffset: props.initialScrollOffset,
    layoutDeps: () => props.columnCount,
  })

  const virtualRows = createMemo(() => virtualizedGrid.virtualRows())

  createEffect((previousCount?: number) => {
    const nextCount = props.songs.length
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
              getVirtualGridRowSlice(props.songs, virtualRow.index, props.columnCount)
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
                <For each={rowSongs()}>
                  {(song) => <SongCard song={song} versions={props.versions} />}
                </For>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default SongsCardGrid
