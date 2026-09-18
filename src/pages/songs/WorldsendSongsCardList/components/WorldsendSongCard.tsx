import { A } from '@solidjs/router'
import { Show } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.png'
import { JacketImage } from '../../../../components/common/JacketImage'
import { buildWorldsendSongDetailPath } from '../../../../constants/routes'
import type { VersionSummaryDTO, WorldsendChartDTO, WorldsendSongDTO } from '../../../../types/api'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import {
  SONG_CARD_CHART_ROW_HEIGHT_PX,
  SONG_CARD_HEIGHT_PX,
  SONG_CARD_JACKET_HEIGHT_PX,
  SONG_CARD_VERSION_NAME_CLASS,
} from '../../SongsCardList/constants'
import {
  formatSongCardReleaseDate,
  formatSongCardReleaseLine,
  formatSongCardReleaseVersion,
} from '../../SongsCardList/utils/songCardFormat'
import { WORLDSEND_SONG_CARD_COPY } from '../constants'
import {
  formatWorldsendSongCardLevelLine,
  formatWorldsendSongCardNotes,
} from '../utils/worldsendSongCardFormat'

type WorldsendSongCardProps = {
  song: WorldsendSongDTO
  /** 追加日からのバージョン解決に使う一覧 */
  versions: readonly VersionSummaryDTO[]
}

type WorldsendSongCardChartRowProps = {
  chart: WorldsendChartDTO | undefined
}

/**
 * カード下部に属性・星・ノーツ数を上下2段で表示する。
 * 属性または星が未設定のときは行全体を半透明にする。ノーツ数の未設定では薄くしない。
 *
 * @param props - WORLD'S END 譜面。
 * @returns 虹グラデ背景の譜面行。
 */
const WorldsendSongCardChartRow = (props: WorldsendSongCardChartRowProps) => {
  const levelLine = () =>
    props.chart
      ? formatWorldsendSongCardLevelLine(props.chart.attribute, props.chart.level_star)
      : ''
  const notesText = () => (props.chart ? formatWorldsendSongCardNotes(props.chart.notes) : '')
  const fadeUnknownValue = () =>
    props.chart != null && (!props.chart.attribute || props.chart.level_star == null)

  return (
    <div
      class="flex h-full min-w-0 flex-col items-center justify-center gap-px bg-[image:var(--cs-color-worldsend-label-bg)] px-0.5 text-worldsend-label-text"
      classList={{ 'opacity-50': fadeUnknownValue() }}
    >
      <Show when={props.chart}>
        <span
          class="min-w-0 truncate font-sans text-sm font-semibold leading-none"
          title={levelLine()}
        >
          {levelLine()}
        </span>
        <span class="font-jost text-xs font-medium leading-none tabular-nums opacity-80">
          {notesText()}
        </span>
      </Show>
    </div>
  )
}

/**
 * WORLD'S END 楽曲1曲分のカードを表示し、楽曲詳細へ遷移する。
 *
 * @param props - 表示する楽曲とバージョン一覧。
 * @returns 上段にジャケットとメタ情報、下段に属性・星・ノーツ数を置いたカード。
 */
const WorldsendSongCard = (props: WorldsendSongCardProps) => {
  const jacketUrl = () => buildChunithmJacketUrl(props.song.jacket)
  const bpmText = () => (props.song.bpm == null ? '-' : String(props.song.bpm))
  const genreText = () => props.song.genre || '-'
  const releaseDateText = () => formatSongCardReleaseDate(props.song.release)
  const releaseVersionText = () => formatSongCardReleaseVersion(props.song.release, props.versions)
  const releaseText = () => formatSongCardReleaseLine(props.song.release, props.versions)

  return (
    <A
      href={buildWorldsendSongDetailPath(props.song.id)}
      class="flex w-full min-w-0 flex-col overflow-hidden rounded-md border border-border text-inherit no-underline transition-colors hover:bg-interactive-row-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      style={{ height: `${SONG_CARD_HEIGHT_PX}px` }}
      classList={{
        'bg-new-song-bg': props.song.is_new === true,
        'bg-surface': props.song.is_new !== true,
      }}
    >
      <div
        class="flex min-h-0 min-w-0 flex-1 overflow-hidden"
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
          <div class="mt-1 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 gap-y-0.5 text-xs">
            <span class="font-sans text-text-muted">{WORLDSEND_SONG_CARD_COPY.genreLabel}:</span>
            <span class="min-w-0 truncate font-jost text-text" title={genreText()}>
              {genreText()}
            </span>
            <span class="font-sans text-text-muted">{WORLDSEND_SONG_CARD_COPY.bpmLabel}:</span>
            <span class="min-w-0 truncate font-jost text-text tabular-nums" title={bpmText()}>
              {bpmText()}
            </span>
            <span class="font-sans text-text-muted">{WORLDSEND_SONG_CARD_COPY.releaseLabel}:</span>
            <span class="flex min-w-0 flex-col font-jost tabular-nums" title={releaseText()}>
              <span class="truncate text-text">{releaseDateText()}</span>
              <Show when={releaseVersionText()}>
                {(version) => (
                  <span class={`min-w-0 truncate font-sans ${SONG_CARD_VERSION_NAME_CLASS}`}>
                    {version()}
                  </span>
                )}
              </Show>
            </span>
          </div>
        </div>
      </div>
      <div
        class="shrink-0 overflow-hidden"
        style={{ height: `${SONG_CARD_CHART_ROW_HEIGHT_PX}px` }}
      >
        <WorldsendSongCardChartRow chart={props.song.charts.WORLDSEND} />
      </div>
    </A>
  )
}

export default WorldsendSongCard
