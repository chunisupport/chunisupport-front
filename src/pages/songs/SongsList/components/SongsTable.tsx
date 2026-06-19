import { Button } from '@kobalte/core/button'
import { createEffect, createMemo, For, Show } from 'solid-js'
import type { SongDTO } from '../../../../types/api'
import { DIFFICULTY_SHORT_NAME_MAP, difficultyBadgeClass } from '../../../../utils/difficultyUtils'
import { renderSortIndicator } from '../../../users/components/RecordTableUiParts'
import type { SortDirection } from '../../../users/recordTable/sortingQuery'
import {
  SongListAddedDateCell,
  SongListArtistCell,
  SongListBpmCell,
  SongListGenreCell,
  SongListTitleCell,
} from '../../components/SongListMetaCells'
import { createVirtualizedSongsTable, sortAriaValue } from '../../components/virtualizedSongsTable'
import type { SongSortKey } from '../utils/sorting'

const chartOrder = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const
const ROW_HEIGHT = 37
const GRID_TEMPLATE_COLUMNS =
  'minmax(15rem, 1fr) minmax(15rem, 1fr) 8.1rem 5.2rem 3.75rem repeat(5, 3.4rem)'
const HEADER_CELL_CLASS = 'font-semibold whitespace-nowrap bg-surface-muted'
const HEADER_BUTTON_CLASS =
  'flex min-h-[37px] w-full items-center px-3 py-2 text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset'
const CELL_CLASS = 'flex h-[37px] items-center px-3 whitespace-nowrap'
type Props = {
  songs: SongDTO[]
  sortKey: SongSortKey | null
  sortDirection: SortDirection | null
  onSortChange: (key: SongSortKey) => void
}

type HeaderButtonProps = {
  label: string
  active: boolean
  direction: SortDirection | null
  align?: 'start' | 'center'
  onClick: () => void
}

const SongHeaderButton = (props: HeaderButtonProps) => (
  <th
    class={HEADER_CELL_CLASS}
    scope="col"
    aria-sort={sortAriaValue(props.active, props.direction)}
  >
    <Button
      type="button"
      class={`${HEADER_BUTTON_CLASS} ${props.align === 'start' ? 'justify-start' : 'justify-center'}`}
      onClick={props.onClick}
    >
      <span
        class={`flex flex-col ${props.align === 'start' ? 'items-start' : 'items-center'} justify-center gap-0.5 leading-none`}
      >
        <span>{props.label}</span>
        {renderSortIndicator(props.active, props.direction)}
      </span>
    </Button>
  </th>
)

const SongsTable = (props: Props) => {
  const virtualizedTable = createVirtualizedSongsTable({
    getCount: () => props.songs.length,
    rowHeight: ROW_HEIGHT,
    resetOnCountChange: true,
  })

  createEffect(() => {
    props.songs.length
    virtualizedTable.maybeResetScroll()
  })

  const virtualRows = createMemo(() => virtualizedTable.virtualRows())

  return (
    <div
      ref={virtualizedTable.setTableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-md border border-border bg-surface"
    >
      <table class="block min-w-[45rem] text-sm" aria-rowcount={props.songs.length}>
        <thead class="block">
          <tr class="grid" style={{ 'grid-template-columns': GRID_TEMPLATE_COLUMNS }}>
            <SongHeaderButton
              label="タイトル"
              active={props.sortKey === 'title'}
              direction={props.sortDirection}
              align="start"
              onClick={() => props.onSortChange('title')}
            />
            <SongHeaderButton
              label="アーティスト"
              active={props.sortKey === 'artist'}
              direction={props.sortDirection}
              align="start"
              onClick={() => props.onSortChange('artist')}
            />
            <SongHeaderButton
              label="ジャンル"
              active={props.sortKey === 'genre'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('genre')}
            />
            <SongHeaderButton
              label="追加日"
              active={props.sortKey === 'release'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('release')}
            />
            <SongHeaderButton
              label="BPM"
              active={props.sortKey === 'bpm'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('bpm')}
            />
            <For each={chartOrder}>
              {(difficulty) => (
                <SongHeaderButton
                  label={DIFFICULTY_SHORT_NAME_MAP[difficulty]}
                  active={props.sortKey === difficulty.toLowerCase()}
                  direction={props.sortDirection}
                  onClick={() => props.onSortChange(difficulty.toLowerCase() as SongSortKey)}
                />
              )}
            </For>
          </tr>
        </thead>
        <tbody
          ref={virtualizedTable.setTableBodyRef}
          class="relative block min-w-full"
          style={{ height: `${virtualizedTable.getTotalSize()}px` }}
        >
          <For each={virtualRows()}>
            {(virtualRow) => {
              const song = createMemo(() => props.songs[virtualRow.index])

              return (
                <Show when={song()} keyed>
                  {(currentSong) => (
                    <tr
                      class="absolute left-0 top-0 grid min-w-full border-t border-border"
                      style={{
                        'grid-template-columns': GRID_TEMPLATE_COLUMNS,
                        transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                      }}
                      aria-rowindex={virtualRow.index + 2}
                    >
                      <SongListTitleCell
                        href={`/songs/${encodeURIComponent(currentSong.id)}`}
                        title={currentSong.title}
                        class={`${CELL_CLASS} min-w-0`}
                      />
                      <SongListArtistCell
                        artist={currentSong.artist}
                        class={`${CELL_CLASS} min-w-0 font-sans`}
                      />
                      <SongListGenreCell
                        genre={currentSong.genre}
                        class={`${CELL_CLASS} justify-center overflow-hidden`}
                      />
                      <SongListAddedDateCell
                        release={currentSong.release}
                        class={`${CELL_CLASS} justify-center`}
                      />
                      <SongListBpmCell
                        bpm={currentSong.bpm}
                        class={`${CELL_CLASS} justify-center`}
                      />
                      <For each={chartOrder}>
                        {(difficulty) => {
                          const chart = currentSong.charts[difficulty]

                          return (
                            <td
                              class={`${CELL_CLASS} justify-center font-medium ${chart ? difficultyBadgeClass(difficulty) : 'bg-surface text-text-muted'} ${chart?.is_const_unknown ? 'opacity-50' : ''}`}
                            >
                              {chart ? (
                                <>
                                  <span>{chart.const.toFixed(1)}</span>
                                  {chart.is_const_unknown ? (
                                    <sup class="text-[0.65em] leading-none">?</sup>
                                  ) : null}
                                </>
                              ) : null}
                            </td>
                          )
                        }}
                      </For>
                    </tr>
                  )}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default SongsTable
