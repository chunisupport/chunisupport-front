import { createEffect, createMemo, For } from 'solid-js'
import { createWindowVirtualTable } from '../../../../components/common/createWindowVirtualTable'
import type { VersionSummaryDTO, WorldsendSongDTO } from '../../../../types/api'
import {
  SONG_CARD_COLUMN_GAP_PX,
  SONG_CARD_GRID_OVERSCAN,
  SONG_CARD_ROW_HEIGHT_PX,
} from '../../SongsCardList/constants'
import { getSongCardRowCount, getSongCardRowSlice } from '../../SongsCardList/utils/songCardGrid'
import WorldsendSongCard from './WorldsendSongCard'

type WorldsendSongsCardGridProps = {
  songs: WorldsendSongDTO[]
  /** 追加日からのバージョン解決に使う一覧 */
  versions: readonly VersionSummaryDTO[]
  /** 1行あたりの列数 */
  columnCount: number
  /** 仮想グリッド初回アタッチ時のスクロール位置 */
  initialScrollOffset?: number
}

/**
 * WORLD'S END 楽曲カードを仮想化したグリッドとして表示する。
 *
 * @param props - 表示する楽曲、バージョン一覧、列数、初期スクロール位置。
 * @returns 仮想スクロールするカードグリッド。
 */
const WorldsendSongsCardGrid = (props: WorldsendSongsCardGridProps) => {
  const virtualizedGrid = createWindowVirtualTable<
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement,
    HTMLDivElement
  >({
    rowCount: () => getSongCardRowCount(props.songs.length, props.columnCount),
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
              getSongCardRowSlice(props.songs, virtualRow.index, props.columnCount)
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
                  {(song) => <WorldsendSongCard song={song} versions={props.versions} />}
                </For>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

export default WorldsendSongsCardGrid
