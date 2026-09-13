import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.png'
import { JacketImage } from '../../../../components/common/JacketImage'
import { PLAYER_DATA_DIFFICULTIES } from '../../../../constants/difficulty'
import { buildSongDetailPath } from '../../../../constants/routes'
import type {
  ChartDTO,
  PlayerDataDifficulty,
  SongDTO,
  VersionSummaryDTO,
} from '../../../../types/api'
import { formatChartConst } from '../../../../utils/chartConstFormat'
import { difficultyBadgeClass } from '../../../../utils/difficultyUtils'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import {
  SONG_CARD_CHART_ROW_HEIGHT_PX,
  SONG_CARD_COPY,
  SONG_CARD_HEIGHT_PX,
  SONG_CARD_JACKET_HEIGHT_PX,
  SONG_CARD_NOTES_EMPTY,
} from '../constants'
import { formatSongCardReleaseLine } from '../utils/songCardFormat'

type SongCardProps = {
  song: SongDTO
  /** 追加日からのバージョン解決に使う一覧 */
  versions: readonly VersionSummaryDTO[]
}

type SongCardChartCellProps = {
  chart: ChartDTO | null | undefined
  difficulty: PlayerDataDifficulty
}

/**
 * 譜面のノーツ数をカード表示用の文字列に変換する。
 *
 * @param notes - ノーツ数。未設定は null。
 * @returns 表示文字列。未設定はプレースホルダ。
 */
const formatChartNotes = (notes: number | null): string =>
  notes == null ? SONG_CARD_NOTES_EMPTY : String(notes)

/**
 * カード内の1難易度セルに譜面定数とノーツ数を上下表示する。
 * 譜面が無い場合も難易度色だけ表示する。
 * 譜面定数が未確定、またはノーツ数が未設定のときはセル全体を半透明にする。
 *
 * @param props - 譜面データと難易度。
 * @returns 色付きの難易度セル。
 */
const SongCardChartCell = (props: SongCardChartCellProps) => {
  const constText = () => (props.chart ? formatChartConst(props.chart.const) : '')
  const notesText = () => (props.chart ? formatChartNotes(props.chart.notes) : '')
  const isUnknownConst = () => Boolean(props.chart?.is_const_unknown)
  const isMissingNotes = () => props.chart != null && props.chart.notes == null
  const fadeUnknownValue = () => isUnknownConst() || isMissingNotes()

  return (
    <div
      class={`flex min-w-0 flex-col items-center justify-center gap-px px-0.5 ${difficultyBadgeClass(props.difficulty)}`}
      classList={{ 'opacity-50': fadeUnknownValue() }}
    >
      <Show when={props.chart}>
        <span class="font-jost text-sm font-semibold leading-none tabular-nums">
          {constText()}
          <Show when={isUnknownConst()}>
            <sup class="text-[0.65em] leading-none">?</sup>
          </Show>
        </span>
        <span class="font-jost text-xs font-medium leading-none tabular-nums opacity-80">
          {notesText()}
        </span>
      </Show>
    </div>
  )
}

/**
 * 通常楽曲1曲分のカードを表示し、楽曲詳細へ遷移する。
 *
 * @param props - 表示する楽曲。
 * @returns 上段にジャケットとメタ情報、下段に難易度セルを置いたカード。
 */
const SongCard = (props: SongCardProps) => {
  const jacketUrl = () => buildChunithmJacketUrl(props.song.jacket)
  const bpmText = () => (props.song.bpm == null ? '-' : String(props.song.bpm))
  const genreText = () => props.song.genre || '-'
  const releaseText = () => formatSongCardReleaseLine(props.song.release, props.versions)

  return (
    <A
      href={buildSongDetailPath(props.song.id)}
      class="flex w-full min-w-0 flex-col overflow-hidden rounded-md border border-border text-inherit no-underline transition-colors hover:bg-interactive-row-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      style={{ height: `${SONG_CARD_HEIGHT_PX}px` }}
      classList={{
        'bg-new-song-bg': props.song.is_new === true,
        'bg-surface': props.song.is_new !== true,
      }}
    >
      <div
        class="flex min-h-0 min-w-0 flex-1"
        style={{ height: `${SONG_CARD_JACKET_HEIGHT_PX}px` }}
      >
        <JacketImage
          source={jacketUrl() ?? undefined}
          alt=""
          ariaHidden={true}
          class="block h-32 w-32 shrink-0 overflow-hidden bg-surface"
          imageClass="h-full w-full object-cover"
          fallback={<img src={placeholderImageUrl} alt="" class="h-full w-full object-cover" />}
        />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5 p-2">
          <p class="min-w-0 truncate font-sans text-sm font-semibold" title={props.song.title}>
            {props.song.title}
          </p>
          <p class="min-w-0 truncate font-sans text-xs text-text-muted" title={props.song.artist}>
            {props.song.artist}
          </p>
          <div class="mt-1 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-1.5 gap-y-0.5 text-xs">
            <span class="font-sans text-text-subtle">{SONG_CARD_COPY.genreLabel}:</span>
            <span class="min-w-0 truncate font-jost" title={genreText()}>
              {genreText()}
            </span>
            <span class="font-sans text-text-subtle">{SONG_CARD_COPY.bpmLabel}:</span>
            <span class="min-w-0 truncate font-jost tabular-nums" title={bpmText()}>
              {bpmText()}
            </span>
            <span class="font-sans text-text-subtle">{SONG_CARD_COPY.releaseLabel}:</span>
            <span class="min-w-0 truncate font-jost tabular-nums" title={releaseText()}>
              {releaseText()}
            </span>
          </div>
        </div>
      </div>
      <div
        class="grid shrink-0 grid-cols-5 overflow-hidden"
        style={{ height: `${SONG_CARD_CHART_ROW_HEIGHT_PX}px` }}
      >
        <For each={PLAYER_DATA_DIFFICULTIES}>
          {(difficulty) => (
            <SongCardChartCell chart={props.song.charts[difficulty]} difficulty={difficulty} />
          )}
        </For>
      </div>
    </A>
  )
}

export default SongCard
