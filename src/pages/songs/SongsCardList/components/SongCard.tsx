import { A } from '@solidjs/router'
import { For, Show } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.png'
import { JacketImage } from '../../../../components/common/JacketImage'
import { PLAYER_DATA_DIFFICULTIES } from '../../../../constants/difficulty'
import { buildSongDetailPath } from '../../../../constants/routes'
import type { ChartDTO, PlayerDataDifficulty, SongDTO } from '../../../../types/api'
import { formatChartConst } from '../../../../utils/chartConstFormat'
import { difficultyBadgeClass } from '../../../../utils/difficultyUtils'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { formatUpdatedAt } from '../../../../utils/recordUpdatedAt'
import { SONG_CARD_HEIGHT_PX, SONG_CARD_NOTES_EMPTY, SONG_CARD_WIDTH_PX } from '../constants'

type SongCardProps = {
  song: SongDTO
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
 *
 * @param props - 譜面データと難易度。
 * @returns 色付きの難易度セル。譜面が無い場合は空セル。
 */
const SongCardChartCell = (props: SongCardChartCellProps) => {
  const constText = () => (props.chart ? formatChartConst(props.chart.const) : '')
  const notesText = () => (props.chart ? formatChartNotes(props.chart.notes) : '')
  const isUnknownConst = () => Boolean(props.chart?.is_const_unknown)

  return (
    <div
      class={`flex min-w-0 flex-col items-center justify-center gap-px px-0.5 ${
        props.chart ? difficultyBadgeClass(props.difficulty) : 'bg-surface text-text-muted'
      }`}
    >
      <Show when={props.chart}>
        <span class="font-jost text-xs font-semibold leading-none tabular-nums">
          {constText()}
          <Show when={isUnknownConst()}>
            <sup class="text-[0.65em] leading-none">?</sup>
          </Show>
        </span>
        <span class="font-jost text-[0.65rem] font-medium leading-none tabular-nums opacity-80">
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
 * @returns ジャケット・メタ情報・難易度セルを横並びにしたカード。
 */
const SongCard = (props: SongCardProps) => {
  const jacketUrl = () => buildChunithmJacketUrl(props.song.jacket)
  const bpmText = () => (props.song.bpm == null ? '-' : String(props.song.bpm))
  const releaseText = () => formatUpdatedAt(props.song.release)
  const genreText = () => props.song.genre || '-'

  return (
    <A
      href={buildSongDetailPath(props.song.id)}
      class="flex shrink-0 overflow-hidden rounded-md border border-border text-inherit no-underline transition-colors hover:bg-interactive-row-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      style={{ width: `${SONG_CARD_WIDTH_PX}px`, height: `${SONG_CARD_HEIGHT_PX}px` }}
      classList={{
        'bg-new-song-bg': props.song.is_new === true,
        'bg-surface': props.song.is_new !== true,
      }}
    >
      <JacketImage
        source={jacketUrl() ?? undefined}
        alt=""
        ariaHidden={true}
        class="block h-32 w-32 shrink-0 overflow-hidden bg-surface"
        imageClass="h-full w-full object-cover"
        fallback={<img src={placeholderImageUrl} alt="" class="h-full w-full object-cover" />}
      />
      <div class="flex min-w-0 flex-1 flex-col gap-1 p-2">
        <p class="min-w-0 truncate font-sans text-sm font-semibold" title={props.song.title}>
          {props.song.title}
        </p>
        <p class="min-w-0 truncate font-sans text-xs text-text-muted" title={props.song.artist}>
          {props.song.artist}
        </p>
        <div class="flex min-w-0 items-center gap-2 text-xs text-text-muted">
          <span class="min-w-0 truncate font-sans" title={genreText()}>
            {genreText()}
          </span>
          <span class="shrink-0 font-jost tabular-nums">{bpmText()}</span>
          <span class="shrink-0 font-jost tabular-nums">{releaseText()}</span>
        </div>
        <div class="mt-auto grid min-h-10 grid-cols-5 overflow-hidden rounded-sm">
          <For each={PLAYER_DATA_DIFFICULTIES}>
            {(difficulty) => (
              <SongCardChartCell chart={props.song.charts[difficulty]} difficulty={difficulty} />
            )}
          </For>
        </div>
      </div>
    </A>
  )
}

export default SongCard
