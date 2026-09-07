import { createMemo, For, Show } from 'solid-js'
import { createWindowVirtualTable } from '../../../../components/common/createWindowVirtualTable'
import { SortableTableHeaderCell } from '../../../../components/common/SortableTableHeader'
import {
  DIFFICULTY_SHORT_NAME_MAP,
  PLAYER_DATA_DIFFICULTIES,
} from '../../../../constants/difficulty'
import type { ChartDTO, PlayerDataDifficulty, SongDTO } from '../../../../types/api'
import { formatChartConst } from '../../../../utils/chartConstFormat'
import { difficultyBadgeClass } from '../../../../utils/difficultyUtils'
import type { SortDirection } from '../../../../utils/sortingQuery'
import {
  SongListAddedDateCell,
  SongListArtistCell,
  SongListBpmCell,
  SongListGenreCell,
  SongListTitleCell,
} from '../../components/SongListMetaCells'
import {
  SONG_CHART_DISPLAY_LABELS,
  SONG_CHART_NOTES_EMPTY,
  type SongChartDisplayMode,
} from '../constants'
import type { SongSortKey } from '../utils/sorting'

const chartOrder = PLAYER_DATA_DIFFICULTIES
const ROW_HEIGHT = 37
const GRID_TEMPLATE_COLUMNS =
  'minmax(15rem, 1fr) minmax(15rem, 1fr) 8.1rem 5.2rem 3.75rem repeat(5, 3.4rem)'
const HEADER_CELL_CLASS = 'font-semibold whitespace-nowrap bg-surface-muted'
const HEADER_BUTTON_CLASS =
  'flex min-h-[37px] w-full items-center px-3 py-2 text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset'
const CELL_CLASS = 'flex h-[37px] items-center px-3 whitespace-nowrap'
const CHART_SECONDARY_TEXT_CLASS = 'text-[0.7rem] font-normal leading-none opacity-80'
const UNKNOWN_CONST_MARK_CLASS = 'text-[0.65em] leading-none'

type Props = {
  songs: SongDTO[]
  displayMode: SongChartDisplayMode
  sortKey: SongSortKey | null
  sortDirection: SortDirection | null
  /** 仮想テーブル初回アタッチ時のスクロール位置 */
  initialScrollOffset?: number
  onSortChange: (key: SongSortKey) => void
}

type ChartDifficultyCellProps = {
  chart: ChartDTO | null | undefined
  difficulty: PlayerDataDifficulty
  displayMode: SongChartDisplayMode
}

/**
 * 譜面のノーツ数を一覧表示用の文字列に変換する。
 *
 * @param notes - ノーツ数。未設定は null。
 * @returns 表示文字列。未設定はプレースホルダ。
 */
const formatChartNotes = (notes: number | null): string =>
  notes == null ? SONG_CHART_NOTES_EMPTY : String(notes)

/**
 * 楽曲一覧テーブルのヘッダーボタンに適用する配置クラスを返す。
 *
 * @param align - ヘッダー内容の配置。
 * @returns 基本スタイルと配置を組み合わせたクラス名。
 */
const headerButtonClass = (align?: 'start' | 'center') =>
  `${HEADER_BUTTON_CLASS} ${align === 'start' ? 'justify-start' : 'justify-center'}`

/**
 * 難易度列のセルに譜面定数とノーツ数を重ねて表示する。
 * 表示モード側の値を上段の大きく太い文字、もう一方を下段の小さく細く薄い文字にする。
 * 譜面定数が未確定の場合は表示位置にかかわらず「?」を付ける。
 * 上段の値が未確定または未設定のときはセル全体を半透明にする。
 *
 * @param props - 譜面データ、難易度、難易度列の表示モード
 * @returns 譜面定数とノーツ数を上下に重ねた難易度セル
 */
const ChartDifficultyCell = (props: ChartDifficultyCellProps) => {
  const constText = () => (props.chart ? formatChartConst(props.chart.const) : '')
  const notesText = () => (props.chart ? formatChartNotes(props.chart.notes) : '')
  const isNotesMode = () => props.displayMode === 'notes'
  const isUnknownConst = () => Boolean(props.chart?.is_const_unknown)
  const isMissingNotes = () => props.chart != null && props.chart.notes == null
  const showUnknownConstOnPrimary = () => isUnknownConst() && !isNotesMode()
  const fadePrimaryUnknown = () => (isNotesMode() ? isMissingNotes() : showUnknownConstOnPrimary())

  return (
    <td
      class={`${CELL_CLASS} flex-col justify-center gap-px ${
        props.chart ? difficultyBadgeClass(props.difficulty) : 'bg-surface text-text-muted'
      }`}
      classList={{ 'opacity-50': fadePrimaryUnknown() }}
    >
      <Show when={props.chart}>
        <span class="leading-none font-medium">
          {isNotesMode() ? notesText() : constText()}
          <Show when={showUnknownConstOnPrimary()}>
            <sup class={UNKNOWN_CONST_MARK_CLASS}>?</sup>
          </Show>
        </span>
        <span class={CHART_SECONDARY_TEXT_CLASS}>
          {isNotesMode() ? constText() : notesText()}
          <Show when={isNotesMode() && isUnknownConst()}>
            <sup class={UNKNOWN_CONST_MARK_CLASS}>?</sup>
          </Show>
        </span>
      </Show>
    </td>
  )
}

/**
 * 楽曲DBの楽曲一覧を仮想化テーブルとして表示します。
 *
 * @param props - 楽曲一覧、難易度列の表示モード、ソート状態、ソート変更時のコールバック
 * @returns 新曲を強調表示し、難易度列に譜面定数とノーツ数を重ねた楽曲一覧テーブル
 */
const SongsTable = (props: Props) => {
  const virtualizedTable = createWindowVirtualTable<
    HTMLDivElement,
    HTMLTableSectionElement,
    HTMLDivElement,
    HTMLTableRowElement
  >({
    rowCount: () => props.songs.length,
    rowHeight: ROW_HEIGHT,
    resetOnRowCountChange: true,
    initialOffset: props.initialScrollOffset,
  })

  const virtualRows = createMemo(() => virtualizedTable.virtualRows())

  return (
    <div
      ref={virtualizedTable.setTableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-md border border-border bg-surface"
    >
      <table class="block min-w-180 text-sm" aria-rowcount={props.songs.length + 1}>
        <caption class="sr-only">{SONG_CHART_DISPLAY_LABELS[props.displayMode]}</caption>
        <thead class="block">
          <tr class="grid" style={{ 'grid-template-columns': GRID_TEMPLATE_COLUMNS }}>
            <SortableTableHeaderCell
              label="タイトル"
              active={props.sortKey === 'title'}
              direction={props.sortDirection}
              align="start"
              thClass={HEADER_CELL_CLASS}
              buttonClass={headerButtonClass('start')}
              onClick={() => props.onSortChange('title')}
            />
            <SortableTableHeaderCell
              label="アーティスト"
              active={props.sortKey === 'artist'}
              direction={props.sortDirection}
              align="start"
              thClass={HEADER_CELL_CLASS}
              buttonClass={headerButtonClass('start')}
              onClick={() => props.onSortChange('artist')}
            />
            <SortableTableHeaderCell
              label="ジャンル"
              active={props.sortKey === 'genre'}
              direction={props.sortDirection}
              thClass={HEADER_CELL_CLASS}
              buttonClass={headerButtonClass()}
              onClick={() => props.onSortChange('genre')}
            />
            <SortableTableHeaderCell
              label="追加日"
              active={props.sortKey === 'release'}
              direction={props.sortDirection}
              thClass={HEADER_CELL_CLASS}
              buttonClass={headerButtonClass()}
              onClick={() => props.onSortChange('release')}
            />
            <SortableTableHeaderCell
              label="BPM"
              active={props.sortKey === 'bpm'}
              direction={props.sortDirection}
              thClass={HEADER_CELL_CLASS}
              buttonClass={headerButtonClass()}
              onClick={() => props.onSortChange('bpm')}
            />
            <For each={chartOrder}>
              {(difficulty) => (
                <SortableTableHeaderCell
                  label={DIFFICULTY_SHORT_NAME_MAP[difficulty]}
                  active={props.sortKey === difficulty.toLowerCase()}
                  direction={props.sortDirection}
                  thClass={HEADER_CELL_CLASS}
                  buttonClass={headerButtonClass()}
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
                      classList={{ 'bg-new-song-bg': currentSong.is_new === true }}
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
                        {(difficulty) => (
                          <ChartDifficultyCell
                            chart={currentSong.charts[difficulty]}
                            difficulty={difficulty}
                            displayMode={props.displayMode}
                          />
                        )}
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
