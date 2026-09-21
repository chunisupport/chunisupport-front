import { A } from '@solidjs/router'
import { createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { fetchAllSongs, fetchWorldsendSongs } from '../../api/songs'
import { Loading } from '../../components'
import { AppTabContent, SegmentedTabs } from '../../components/common/AppTabs'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import {
  RECORD_ROW_MIN_HEIGHT_CLASS,
  RecordHeaderButton,
} from '../../components/common/record/RecordDisplayParts'
import { getSortAriaValue } from '../../components/common/SortableTableHeader'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../../constants/routes'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { PlayerDataDifficulty } from '../../types/api'
import { formatInteger, formatTruncatedFixed } from '../../utils/numberFormat'
import { nextSortState, type SortDirection } from '../../utils/sortingQuery'
import {
  ADMIN_DATA_COVERAGE_COPY,
  DATA_COVERAGE_LEVEL_COLUMN_CLASS,
  DATA_COVERAGE_PERCENT_DECIMAL_PLACES,
  DATA_COVERAGE_TABS,
  DATA_COVERAGE_VALUE_COLUMN_CLASS,
} from './AdminDataCoveragePage.constants'
import {
  buildChartConstantCoverage,
  buildChartMetadataCoverage,
  type ChartConstantCoverage,
  type ChartMetadataCoverage,
  type ChartMetadataCoverageField,
  DATA_COVERAGE_DIFFICULTIES,
  type DataCoverageCount,
  type DataCoverageDifficulty,
  type MissingChartMetadataEntry,
  type MissingChartsSortKey,
  sortMissingCharts,
  sortUnknownCharts,
  type UnknownChartConstantEntry,
  type UnknownChartsSortKey,
} from './dataCoverage'

/** 未判明・未登録表のヘッダーに共通適用するクラス。レコード表のヘッダーと合わせる */
const DATA_COVERAGE_TABLE_HEAD_CLASS = 'bg-surface-muted text-xs font-semibold'

/** 未判明・未登録表の曲名セル全体を覆うリンクに共通適用するクラス。レコード表の行高に合わせる */
const DATA_COVERAGE_SONG_LINK_CLASS = `flex w-full items-center px-3 py-1 ${RECORD_ROW_MIN_HEIGHT_CLASS} hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset`

/** 未判明・未登録表の難易度・Lvセルに共通適用するクラス。レコード表の行高に合わせる */
const DATA_COVERAGE_TABLE_CELL_CLASS = 'w-px px-3 py-1 text-center'

/**
 * 譜面定数未判明譜面の楽曲詳細画面パスを生成する。
 *
 * @param chart - リンク対象の未判明譜面。
 * @returns 難易度クエリ付きの通常楽曲詳細画面パス。
 */
const buildUnknownChartHref = (chart: UnknownChartConstantEntry): string =>
  buildSongDetailPath(chart.songId, chart.difficulty)

/**
 * メタデータ未登録譜面の楽曲詳細画面パスを生成する。
 *
 * @param chart - リンク対象の未登録譜面。
 * @returns 通常楽曲またはWORLD'S END楽曲の詳細画面パス。
 */
const buildMissingChartHref = (chart: MissingChartMetadataEntry): string =>
  chart.difficulty === 'WORLDS_END'
    ? buildWorldsendSongDetailPath(chart.songId)
    : buildSongDetailPath(chart.songId, chart.difficulty)

/**
 * HTTPキャッシュを利用せず有効な通常楽曲とWORLD'S END楽曲を取得する。
 *
 * @returns APIから取得した最新の通常楽曲一覧とWORLD'S END楽曲一覧。
 */
const fetchFreshCoverageSongs = async () => {
  const [standardResponse, worldsendResponse] = await Promise.all([
    fetchAllSongs({ cache: 'no-store' }),
    fetchWorldsendSongs({ cache: 'no-store' }),
  ])

  return {
    songs: standardResponse.songs,
    worldsendSongs: worldsendResponse.songs,
  }
}

type CoverageValueProps = {
  /** 表示する判明数、総数、充足率 */
  coverage: DataCoverageCount
  /** 数値の配置。既定は中央揃え、総合充足率は左寄せで表示する */
  align?: 'center' | 'left'
}

/**
 * 判明数、総数、充足率を1つの集計値として表示する。
 *
 * 該当譜面がない場合は件数を細字の薄色で表示し、目立たないようにする。
 *
 * @param props - 表示対象の集計値と配置。
 * @returns 件数と小数第2位まで切り捨てた充足率。
 */
const CoverageValue = (props: CoverageValueProps) => (
  <span
    class={`inline-flex flex-col gap-0.5 whitespace-nowrap font-jost tabular-nums ${
      props.align === 'left' ? 'items-start text-left' : 'items-center text-center'
    }`}
  >
    <span
      class={`text-[1.125em] leading-tight ${
        props.coverage.total === 0 ? 'font-normal text-text-subtle' : 'font-bold'
      }`}
    >
      {formatInteger(props.coverage.known)} / {formatInteger(props.coverage.total)}
    </span>
    <span
      class={`text-sm font-normal ${
        props.coverage.total === 0 ? 'text-text-subtle' : 'text-text-muted'
      }`}
    >
      {props.coverage.total > 0
        ? `${formatTruncatedFixed(props.coverage.percent, DATA_COVERAGE_PERCENT_DECIMAL_PLACES)}%`
        : ADMIN_DATA_COVERAGE_COPY.unavailablePercentage}
    </span>
  </span>
)

type CoverageCellProps = {
  /** セルに表示する判明数、総数、充足率 */
  coverage: DataCoverageCount
  /** 全体集計セルとして強調するか */
  emphasized?: boolean
}

/**
 * 充足率に応じた背景バーと集計値を表のセルとして表示する。
 *
 * @param props - 表示対象の集計値と強調設定。
 * @returns 充足率を背景幅で示す集計セル。
 */
const CoverageCell = (props: CoverageCellProps) => (
  <td
    class={`border border-border p-0 text-center ${props.emphasized === true ? 'bg-surface-muted/50 font-semibold' : ''}`}
  >
    <div class="relative flex justify-center overflow-hidden px-3 py-1">
      <span
        aria-hidden="true"
        class="absolute inset-y-0 left-0 bg-action-primary-muted"
        style={{ width: `${props.coverage.percent}%` }}
      />
      <span class="relative">
        <CoverageValue coverage={props.coverage} />
      </span>
    </div>
  </td>
)

type CoverageSummaryProps = {
  /** 総合充足率の見出し */
  heading: string
  /** 表示する総合集計 */
  coverage: DataCoverageCount
}

/**
 * 総合充足率を数値とプログレスバーで表示する。
 *
 * @param props - 見出しと総合集計。
 * @returns 総合充足率カード。
 */
const CoverageSummary = (props: CoverageSummaryProps) => (
  <section class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <h2 class="text-sm font-medium text-text-muted">{props.heading}</h2>
    <div class="mt-2 flex justify-start text-3xl font-semibold text-text">
      <CoverageValue coverage={props.coverage} align="left" />
    </div>
    <progress
      class="mt-4 h-3 w-full appearance-none overflow-hidden rounded bg-action-secondary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary"
      value={props.coverage.percent}
      max="100"
      aria-label={props.heading}
    >
      {formatTruncatedFixed(props.coverage.percent, DATA_COVERAGE_PERCENT_DECIMAL_PLACES)}%
    </progress>
  </section>
)

type CoverageMatrixProps = {
  /** 難易度・レベル別の譜面定数充足状況 */
  coverage: ChartConstantCoverage
}

/**
 * 難易度とレベルを行列にした譜面定数充足状況を表示する。
 *
 * @param props - 表示する譜面定数充足状況。
 * @returns 難易度を列、レベルを行にした集計表。
 */
const CoverageMatrix = (props: CoverageMatrixProps) => {
  /**
   * レベル10以上の譜面が存在する難易度だけを表示対象とする。
   *
   * @returns マトリクスへ表示する難易度の一覧。
   */
  const visibleDifficulties = () =>
    PLAYER_DATA_DIFFICULTIES.filter(
      (difficulty) => props.coverage.byDifficulty[difficulty].total > 0
    )

  return (
    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-text">
        {ADMIN_DATA_COVERAGE_COPY.chartConstant.matrixHeading}
      </h2>
      <div class="overflow-x-auto rounded-lg border border-border bg-surface">
        <table class="min-w-full table-fixed border-collapse text-sm whitespace-nowrap">
          <caption class="sr-only">{ADMIN_DATA_COVERAGE_COPY.chartConstant.matrixCaption}</caption>
          <colgroup>
            <col class={DATA_COVERAGE_LEVEL_COLUMN_CLASS} />
            <For each={visibleDifficulties()}>
              {() => <col class={DATA_COVERAGE_VALUE_COLUMN_CLASS} />}
            </For>
            <col class={DATA_COVERAGE_VALUE_COLUMN_CLASS} />
          </colgroup>
          <thead class="bg-surface-muted">
            <tr>
              <th class="border border-border px-3 py-1 text-center" scope="col">
                {ADMIN_DATA_COVERAGE_COPY.levelColumn}
              </th>
              <For each={visibleDifficulties()}>
                {(difficulty) => (
                  <th class="border border-border px-3 py-1 text-center" scope="col">
                    <DifficultyBadge difficulty={difficulty} />
                  </th>
                )}
              </For>
              <th class="border border-border px-3 py-1 text-center" scope="col">
                {ADMIN_DATA_COVERAGE_COPY.totalColumn}
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={props.coverage.rows}>
              {(row) => (
                <tr class="border-t border-border">
                  <th
                    class="border border-border px-3 py-1 text-center font-jost text-base"
                    scope="row"
                  >
                    {row.level}
                  </th>
                  <For each={visibleDifficulties()}>
                    {(difficulty) => <CoverageCell coverage={row.byDifficulty[difficulty]} />}
                  </For>
                  <CoverageCell coverage={row.total} emphasized />
                </tr>
              )}
            </For>
          </tbody>
          <tfoot class="border-t-2 border-border-strong bg-surface-muted font-semibold">
            <tr>
              <th
                aria-label={ADMIN_DATA_COVERAGE_COPY.chartConstant.allLevelsRowAriaLabel}
                class="border border-border px-3 py-1"
                scope="row"
              />
              <For each={visibleDifficulties()}>
                {(difficulty) => (
                  <CoverageCell coverage={props.coverage.byDifficulty[difficulty]} />
                )}
              </For>
              <CoverageCell coverage={props.coverage.overall} emphasized />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

/**
 * 通常難易度またはWORLD'S ENDの表示ラベルを返す。
 *
 * @param props.difficulty - 表示する譜面区分。
 * @returns 難易度バッジまたはWORLD'S ENDラベル。
 */
const CoverageDifficultyLabel = (props: { difficulty: DataCoverageDifficulty }) => (
  <Show
    when={props.difficulty !== 'WORLDS_END'}
    fallback={
      <span class="inline-flex items-center justify-center rounded bg-[image:var(--cs-color-worldsend-label-bg)] px-3 py-1 text-xs font-semibold tracking-wide whitespace-nowrap text-worldsend-label-text">
        {ADMIN_DATA_COVERAGE_COPY.worldsendDifficulty}
      </span>
    }
  >
    <DifficultyBadge difficulty={props.difficulty as PlayerDataDifficulty} />
  </Show>
)

type DifficultyCoverageTableProps = {
  /** 表の見出し */
  heading: string
  /** スクリーンリーダー向けの表題 */
  caption: string
  /** 譜面区分別の充足状況 */
  coverage: ChartMetadataCoverage
}

/**
 * ノーツ数またはNOTES DESIGNERの充足状況を譜面区分別に表示する。
 *
 * @param props - 見出し、表題、譜面区分別集計。
 * @returns 譜面区分ごとの集計表。
 */
const DifficultyCoverageTable = (props: DifficultyCoverageTableProps) => {
  /**
   * 集計対象の譜面が存在する譜面区分だけを返す。
   *
   * @returns 表へ表示する譜面区分。
   */
  const visibleDifficulties = () =>
    DATA_COVERAGE_DIFFICULTIES.filter(
      (difficulty) => props.coverage.byDifficulty[difficulty].total > 0
    )

  return (
    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-text">{props.heading}</h2>
      <div class="overflow-x-auto rounded-lg border border-border bg-surface">
        <table class="min-w-full table-fixed border-collapse text-sm whitespace-nowrap">
          <caption class="sr-only">{props.caption}</caption>
          <colgroup>
            <For each={visibleDifficulties()}>
              {() => <col class={DATA_COVERAGE_VALUE_COLUMN_CLASS} />}
            </For>
            <col class={DATA_COVERAGE_VALUE_COLUMN_CLASS} />
          </colgroup>
          <thead class="bg-surface-muted">
            <tr>
              <For each={visibleDifficulties()}>
                {(difficulty) => (
                  <th class="border border-border px-3 py-1 text-center" scope="col">
                    <CoverageDifficultyLabel difficulty={difficulty} />
                  </th>
                )}
              </For>
              <th class="border border-border px-3 py-1 text-center" scope="col">
                {ADMIN_DATA_COVERAGE_COPY.totalColumn}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-border">
              <For each={visibleDifficulties()}>
                {(difficulty) => (
                  <CoverageCell coverage={props.coverage.byDifficulty[difficulty]} />
                )}
              </For>
              <CoverageCell coverage={props.coverage.overall} emphasized />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}

type MissingChartsProps = {
  /** 一覧見出し */
  heading: string
  /** スクリーンリーダー向けの表題 */
  caption: string
  /** 空の場合に表示する文言 */
  emptyMessage: string
  /** 未登録譜面の一覧 */
  charts: ChartMetadataCoverage['missingCharts']
}

/**
 * ノーツ数またはNOTES DESIGNERが未登録の譜面を表示する。
 *
 * ヘッダーの高さと文字サイズはレコード表の基準に合わせ、曲名と難易度でソートできる。
 *
 * @param props - 一覧の文言と未登録譜面。
 * @returns 未登録件数と譜面一覧。
 */
const MissingCharts = (props: MissingChartsProps) => {
  const [sortKey, setSortKey] = createSignal<MissingChartsSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedCharts = createMemo(() => sortMissingCharts(props.charts, sortKey(), sortDirection()))

  /**
   * ヘッダークリック時に昇順、降順、解除を循環させる。
   *
   * @param nextKey - 操作された列のソートキー。
   * @returns なし。
   */
  const handleSortChange = (nextKey: MissingChartsSortKey): void => {
    const next = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(next.sortKey)
    setSortDirection(next.sortDirection)
  }

  return (
    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-text">{props.heading}</h2>
      <p class="font-jost text-sm text-text-muted tabular-nums whitespace-nowrap">
        {formatInteger(props.charts.length)}
        {ADMIN_DATA_COVERAGE_COPY.countSuffix}
      </p>
      <Show
        when={props.charts.length > 0}
        fallback={
          <p class="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
            {props.emptyMessage}
          </p>
        }
      >
        <div class="overflow-x-auto rounded-lg border border-border bg-surface">
          <table class="min-w-full text-sm whitespace-nowrap">
            <caption class="sr-only">{props.caption}</caption>
            <thead class={DATA_COVERAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th
                  class="w-full px-2"
                  scope="col"
                  aria-sort={getSortAriaValue(sortKey() === 'songTitle', sortDirection())}
                >
                  <RecordHeaderButton
                    label={ADMIN_DATA_COVERAGE_COPY.songColumn}
                    active={sortKey() === 'songTitle'}
                    direction={sortDirection()}
                    align="start"
                    class="justify-start"
                    onClick={() => handleSortChange('songTitle')}
                  />
                </th>
                <th
                  class="w-px px-2"
                  scope="col"
                  aria-sort={getSortAriaValue(sortKey() === 'difficulty', sortDirection())}
                >
                  <RecordHeaderButton
                    label={ADMIN_DATA_COVERAGE_COPY.difficultyColumn}
                    active={sortKey() === 'difficulty'}
                    direction={sortDirection()}
                    align="center"
                    class="justify-center"
                    onClick={() => handleSortChange('difficulty')}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={sortedCharts()}>
                {(chart) => (
                  <tr class="border-t border-border">
                    <td class="max-w-0 p-0 font-sans text-text">
                      <A
                        href={buildMissingChartHref(chart)}
                        class={DATA_COVERAGE_SONG_LINK_CLASS}
                        title={chart.songTitle}
                      >
                        <span class="min-w-0 truncate">{chart.songTitle}</span>
                      </A>
                    </td>
                    <td class={DATA_COVERAGE_TABLE_CELL_CLASS}>
                      <CoverageDifficultyLabel difficulty={chart.difficulty} />
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </section>
  )
}

type UnknownChartsListProps = {
  /** 譜面定数が未判明の譜面一覧 */
  charts: ChartConstantCoverage['unknownCharts']
}

/**
 * 譜面定数が未判明の譜面を表示する。
 *
 * ヘッダーの高さと文字サイズはレコード表の基準に合わせ、曲名、難易度、Lvでソートできる。
 *
 * @param props - 未判明譜面一覧。
 * @returns 未判明件数と譜面一覧。
 */
const UnknownChartsList = (props: UnknownChartsListProps) => {
  const [sortKey, setSortKey] = createSignal<UnknownChartsSortKey | null>(null)
  const [sortDirection, setSortDirection] = createSignal<SortDirection | null>(null)
  const sortedCharts = createMemo(() => sortUnknownCharts(props.charts, sortKey(), sortDirection()))

  /**
   * ヘッダークリック時に昇順、降順、解除を循環させる。
   *
   * @param nextKey - 操作された列のソートキー。
   * @returns なし。
   */
  const handleSortChange = (nextKey: UnknownChartsSortKey): void => {
    const next = nextSortState(sortKey(), sortDirection(), nextKey)
    setSortKey(next.sortKey)
    setSortDirection(next.sortDirection)
  }

  return (
    <section class="space-y-3">
      <h2 class="text-xl font-semibold text-text">
        {ADMIN_DATA_COVERAGE_COPY.chartConstant.missingHeading}
      </h2>
      <p class="font-jost text-sm text-text-muted tabular-nums whitespace-nowrap">
        {formatInteger(props.charts.length)}
        {ADMIN_DATA_COVERAGE_COPY.countSuffix}
      </p>
      <Show
        when={props.charts.length > 0}
        fallback={
          <p class="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
            {ADMIN_DATA_COVERAGE_COPY.chartConstant.noMissingCharts}
          </p>
        }
      >
        <div class="overflow-x-auto rounded-lg border border-border bg-surface">
          <table class="min-w-full text-sm whitespace-nowrap">
            <caption class="sr-only">
              {ADMIN_DATA_COVERAGE_COPY.chartConstant.missingCaption}
            </caption>
            <thead class={DATA_COVERAGE_TABLE_HEAD_CLASS}>
              <tr>
                <th
                  class="w-full px-2"
                  scope="col"
                  aria-sort={getSortAriaValue(sortKey() === 'songTitle', sortDirection())}
                >
                  <RecordHeaderButton
                    label={ADMIN_DATA_COVERAGE_COPY.songColumn}
                    active={sortKey() === 'songTitle'}
                    direction={sortDirection()}
                    align="start"
                    class="justify-start"
                    onClick={() => handleSortChange('songTitle')}
                  />
                </th>
                <th
                  class="w-px px-2"
                  scope="col"
                  aria-sort={getSortAriaValue(sortKey() === 'difficulty', sortDirection())}
                >
                  <RecordHeaderButton
                    label={ADMIN_DATA_COVERAGE_COPY.difficultyColumn}
                    active={sortKey() === 'difficulty'}
                    direction={sortDirection()}
                    align="center"
                    class="justify-center"
                    onClick={() => handleSortChange('difficulty')}
                  />
                </th>
                <th
                  class="w-px px-2"
                  scope="col"
                  aria-sort={getSortAriaValue(sortKey() === 'level', sortDirection())}
                >
                  <RecordHeaderButton
                    label={ADMIN_DATA_COVERAGE_COPY.levelColumn}
                    active={sortKey() === 'level'}
                    direction={sortDirection()}
                    align="center"
                    class="justify-center"
                    onClick={() => handleSortChange('level')}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={sortedCharts()}>
                {(chart) => (
                  <tr class="border-t border-border">
                    <td class="max-w-0 p-0 font-sans text-text">
                      <A
                        href={buildUnknownChartHref(chart)}
                        class={DATA_COVERAGE_SONG_LINK_CLASS}
                        title={chart.songTitle}
                      >
                        <span class="min-w-0 truncate">{chart.songTitle}</span>
                      </A>
                    </td>
                    <td class={DATA_COVERAGE_TABLE_CELL_CLASS}>
                      <DifficultyBadge difficulty={chart.difficulty} />
                    </td>
                    <td class={`font-jost tabular-nums ${DATA_COVERAGE_TABLE_CELL_CLASS}`}>
                      {chart.level}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </section>
  )
}

/**
 * 譜面定数の充足状況を表示する。
 *
 * @param props.coverage - 譜面定数の集計結果。
 * @returns 総合集計、レベル別集計、未判明譜面一覧。
 */
const ChartConstantCoverageView = (props: { coverage: ChartConstantCoverage }) => (
  <div class="space-y-6">
    <CoverageSummary
      heading={ADMIN_DATA_COVERAGE_COPY.chartConstant.overallHeading}
      coverage={props.coverage.overall}
    />
    <CoverageMatrix coverage={props.coverage} />
    <UnknownChartsList charts={props.coverage.unknownCharts} />
  </div>
)

type MetadataCoverageViewProps = {
  /** 表示対象の項目 */
  field: ChartMetadataCoverageField
  /** 譜面メタデータの集計結果 */
  coverage: ChartMetadataCoverage
}

/**
 * ノーツ数またはNOTES DESIGNERの充足状況を表示する。
 *
 * @param props - 表示対象項目と集計結果。
 * @returns 総合集計、難易度別集計、未登録譜面一覧。
 */
const MetadataCoverageView = (props: MetadataCoverageViewProps) => {
  const copy = () => ADMIN_DATA_COVERAGE_COPY[props.field]

  return (
    <div class="space-y-6">
      <CoverageSummary heading={copy().overallHeading} coverage={props.coverage.overall} />
      <DifficultyCoverageTable
        heading={copy().difficultyHeading}
        caption={copy().difficultyCaption}
        coverage={props.coverage}
      />
      <MissingCharts
        heading={copy().missingHeading}
        caption={copy().missingCaption}
        emptyMessage={copy().noMissingCharts}
        charts={props.coverage.missingCharts}
      />
    </div>
  )
}

/**
 * ADMINとEDITOR向けの譜面データ充足状況ダッシュボードを表示する。
 *
 * 画面を開くたびに全曲APIを直接呼び、ブラウザキャッシュとは独立した最新の有効楽曲を集計する。
 *
 * @returns 譜面定数、ノーツ数、NOTES DESIGNERの充足状況。
 */
const AdminDataCoveragePage = () => {
  useDocumentTitle(ADMIN_DATA_COVERAGE_COPY.pageTitle)

  const [songsResponse] = createResource(fetchFreshCoverageSongs)

  return (
    <div class="mx-auto w-full max-w-7xl space-y-6 p-4">
      <h1 class="text-2xl font-semibold text-text">{ADMIN_DATA_COVERAGE_COPY.heading}</h1>

      <Show when={!songsResponse.loading} fallback={<Loading />}>
        <Show
          when={!songsResponse.error}
          fallback={
            <p
              class="rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-danger"
              role="alert"
            >
              {ADMIN_DATA_COVERAGE_COPY.loadError}
            </p>
          }
        >
          <Show when={songsResponse()} keyed>
            {(response) => {
              const chartConstantCoverage = buildChartConstantCoverage(response.songs)
              const notesCoverage = buildChartMetadataCoverage(
                response.songs,
                response.worldsendSongs,
                'notes'
              )
              const notesDesignerCoverage = buildChartMetadataCoverage(
                response.songs,
                response.worldsendSongs,
                'notesDesigner'
              )

              return (
                <SegmentedTabs
                  options={DATA_COVERAGE_TABS}
                  defaultValue="chartConstant"
                  listWrapperClass="overflow-x-auto"
                >
                  <AppTabContent value="chartConstant" class="mt-6">
                    <ChartConstantCoverageView coverage={chartConstantCoverage} />
                  </AppTabContent>
                  <AppTabContent value="notes" class="mt-6">
                    <MetadataCoverageView field="notes" coverage={notesCoverage} />
                  </AppTabContent>
                  <AppTabContent value="notesDesigner" class="mt-6">
                    <MetadataCoverageView field="notesDesigner" coverage={notesDesignerCoverage} />
                  </AppTabContent>
                </SegmentedTabs>
              )
            }}
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default AdminDataCoveragePage
