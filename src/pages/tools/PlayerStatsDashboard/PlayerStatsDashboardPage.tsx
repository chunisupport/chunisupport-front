import { A } from '@solidjs/router'
import {
  Award,
  BadgeCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  Gauge,
  Grid3X3,
  Target,
  Trophy,
} from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createResource, createSignal, ErrorBoundary, For, Show } from 'solid-js'
import { fetchMe } from '../../../api/users'
import { LoadError, Loading, PlayerDataEmptyState } from '../../../components'
import { AppSelect } from '../../../components/common/AppSelect'
import {
  AppTabContent,
  SegmentedTabs,
  SegmentedToggleGroup,
} from '../../../components/common/AppTabs'
import { DifficultyBadge } from '../../../components/common/DifficultyBadge'
import { buildSongDetailPath } from '../../../constants/routes'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../../../types/api'
import { fetchUserRecordWithCache } from '../../../usecases/cache/fetchUserRecordWithCache'
import { fetchPlayerStatsChartMetadata } from '../../../usecases/overpower/fetchTheoreticalTargetDifficulties'
import { formatChartConst } from '../../../utils/chartConstFormat'
import { getConstDisplay } from '../../../utils/constDisplay'
import { formatInteger, formatTruncatedFixed } from '../../../utils/numberFormat'
import {
  buildPlayerStatsAchievementProgress,
  buildPlayerStatsChartConstantRows,
  buildPlayerStatsLevelRows,
  buildPlayerStatsMilestone,
  buildPlayerStatsSummary,
  filterPlayerStatsRecords,
  findPlayerStatsCandidates,
  type PlayerStatsCandidate,
  type PlayerStatsCandidateTarget,
  type PlayerStatsChartConstantRow,
  type PlayerStatsDifficulty,
  type PlayerStatsHeatmapRow,
  type PlayerStatsLevelAchievement,
  type PlayerStatsLevelRow,
  type PlayerStatsNotesBySongId,
  type PlayerStatsSummary,
} from '../../../utils/playerStatsDashboard'
import { formatUpdatedAt } from '../../../utils/recordUpdatedAt'
import { getScoreRank } from '../../../utils/scoreRank'
import {
  PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS,
  PLAYER_STATS_ACHIEVEMENT_LABEL,
  PLAYER_STATS_ACHIEVEMENTS,
  PLAYER_STATS_CANDIDATE_LIMIT,
  PLAYER_STATS_CANDIDATE_OPTIONS,
  PLAYER_STATS_COPY,
  PLAYER_STATS_DEFAULT_DIFFICULTY,
  PLAYER_STATS_DIFFICULTY_OPTIONS,
  PLAYER_STATS_HEATMAP_AXIS_OPTIONS,
  PLAYER_STATS_HEATMAP_MAX_MIX_PERCENT,
  PLAYER_STATS_HEATMAP_METRICS,
  PLAYER_STATS_MILESTONE_OPTIONS,
  type PlayerStatsAchievementGroup,
  type PlayerStatsDifficultyOption,
  type PlayerStatsHeatmapAxis,
} from './constants'

/** 統計画面の表示に必要なログインユーザーのレコード情報。 */
type PlayerStatsPageData = {
  username: string
  records: PlayerRecordDTO[]
  targetDifficultyBySongId: Map<string, PlayerDataDifficulty>
  notesBySongId: PlayerStatsNotesBySongId
  updatedAt: string | null
}

/** 主要統計カード1件分の表示定義。 */
type SummaryCardDefinition = {
  label: string
  value: string
  detail: string
  icon: Component<{ class?: string; 'aria-hidden'?: boolean }>
}

/** 統計画面の各セクションに共通適用するカードクラス。 */
const PAGE_SECTION_CLASS = 'rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5'

/**
 * ログインユーザー本人の統計画面用レコードを取得する。
 *
 * @returns ユーザー名、未プレイを含む通常譜面レコード、譜面メタ情報、更新日時。
 */
const fetchPlayerStatsPageData = async (): Promise<PlayerStatsPageData> => {
  const user = await fetchMe()
  const [record, chartMetadata] = await Promise.all([
    fetchUserRecordWithCache(user.username),
    fetchPlayerStatsChartMetadata(),
  ])
  return {
    username: user.username,
    records: record.standard,
    targetDifficultyBySongId: chartMetadata.targetDifficultyBySongId,
    notesBySongId: chartMetadata.notesBySongId,
    updatedAt: record.meta.updated_at,
  }
}

/**
 * サマリー値をカード表示用の定義へ変換する。
 *
 * @param summary - 選択難易度の集計済みサマリー。
 * @returns 表示順に並べたカード定義。
 */
const buildSummaryCardDefinitions = (summary: PlayerStatsSummary): SummaryCardDefinition[] => [
  {
    label: PLAYER_STATS_COPY.playedCharts,
    value: `${formatTruncatedFixed(summary.playedPercent, 1)}%`,
    detail: `${formatInteger(summary.played)} / ${formatInteger(summary.total)}`,
    icon: CheckCircle2,
  },
  {
    label: PLAYER_STATS_COPY.averageScore,
    value: formatInteger(summary.averageScore),
    detail: `${formatInteger(summary.played)}${PLAYER_STATS_COPY.achievementCountSuffix}`,
    icon: Gauge,
  },
  {
    label: PLAYER_STATS_COPY.sssPlus,
    value: formatInteger(summary.sssPlus),
    detail: `${formatTruncatedFixed(summary.sssPlusPercent, 1)}%`,
    icon: Trophy,
  },
  {
    label: PLAYER_STATS_COPY.allJustice,
    value: formatInteger(summary.aj),
    detail: `${formatTruncatedFixed(summary.ajPercent, 1)}%`,
    icon: Award,
  },
  {
    label: PLAYER_STATS_COPY.max,
    value: formatInteger(summary.max),
    detail: `${formatTruncatedFixed(summary.maxPercent, 1)}%`,
    icon: Target,
  },
]

/**
 * 現在地を示す主要統計カードを表示する。
 *
 * @param props.summary - 選択難易度の主要統計。
 * @returns 主要統計カードの一覧。
 */
const SummaryCards = (props: { summary: PlayerStatsSummary }): JSX.Element => (
  <section class={PAGE_SECTION_CLASS} aria-labelledby="player-stats-overview-title">
    <div class="mb-4 flex items-center gap-2">
      <ChartNoAxesCombined class="h-5 w-5 text-action-primary" aria-hidden={true} />
      <div>
        <h2 id="player-stats-overview-title" class="font-semibold text-text">
          {PLAYER_STATS_COPY.overviewTitle}
        </h2>
        <p class="text-xs text-text-muted">{PLAYER_STATS_COPY.overviewCaption}</p>
      </div>
    </div>
    <ul class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <For each={buildSummaryCardDefinitions(props.summary)}>
        {(card) => (
          <li class="rounded-lg border border-border bg-surface-muted p-3">
            <div class="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <card.icon class="h-4 w-4 text-action-primary" aria-hidden={true} />
              <span>{card.label}</span>
            </div>
            <p class="mt-2 font-jost text-2xl font-semibold tabular-nums text-text">{card.value}</p>
            <p class="mt-1 font-jost text-xs tabular-nums text-text-muted">{card.detail}</p>
          </li>
        )}
      </For>
    </ul>
  </section>
)

/**
 * 達成条件1件分の累計件数と割合を表示する。
 *
 * @param props.label - タブ内で表示する到達条件名。
 * @param props.count - 達成譜面数。
 * @param props.total - 集計対象の全譜面数。
 * @param props.percent - 全譜面に対する達成率。
 * @returns ラベル、件数、割合、進捗バーを含む行。
 */
const AchievementRow = (props: {
  label: string
  count: number
  total: number
  percent: number
}): JSX.Element => (
  <li class="grid gap-2 border-b border-border py-3 last:border-b-0 sm:grid-cols-[8rem_6rem_minmax(10rem,1fr)] sm:items-center sm:gap-4">
    <span class="text-sm font-semibold text-text">{props.label}</span>
    <span class="font-jost text-right text-sm tabular-nums text-text-muted">
      {formatInteger(props.count)} {PLAYER_STATS_COPY.heatmapCountSeparator}{' '}
      {formatInteger(props.total)}
    </span>
    <div class="flex items-center gap-3">
      <progress
        aria-label={`${props.label}${PLAYER_STATS_COPY.achievementRateSuffix}`}
        class="h-2 flex-1 appearance-none overflow-hidden rounded bg-action-secondary [&::-moz-progress-bar]:rounded [&::-moz-progress-bar]:bg-action-primary [&::-webkit-progress-bar]:rounded [&::-webkit-progress-bar]:bg-action-secondary [&::-webkit-progress-value]:rounded [&::-webkit-progress-value]:bg-action-primary"
        max={100}
        value={props.percent}
      >
        {props.percent}%
      </progress>
      <span class="w-14 text-right font-jost text-xs tabular-nums text-text-muted">
        {formatTruncatedFixed(props.percent, 1)}%
      </span>
    </div>
  </li>
)

/**
 * RANK、COMBO、HARDの累計達成状況をタブで表示する。
 *
 * @param props.records - 選択難易度の通常譜面レコード。
 * @returns 3種類の達成階段。
 */
const AchievementSection = (props: { records: PlayerRecordDTO[] }): JSX.Element => {
  const renderGroup = (group: PlayerStatsAchievementGroup): JSX.Element => (
    <ul class="mt-4">
      <For
        each={buildPlayerStatsAchievementProgress(props.records, PLAYER_STATS_ACHIEVEMENTS[group])}
      >
        {(progress) => (
          <AchievementRow
            label={
              group === 'combo' && progress.achievement === 'max'
                ? PLAYER_STATS_ACHIEVEMENT_LABEL.ajc
                : PLAYER_STATS_ACHIEVEMENT_LABEL[progress.achievement]
            }
            count={progress.count}
            percent={progress.percent}
            total={props.records.length}
          />
        )}
      </For>
    </ul>
  )

  return (
    <section class={PAGE_SECTION_CLASS} aria-labelledby="player-stats-achievement-title">
      <div class="mb-4 flex items-center gap-2">
        <BadgeCheck class="h-5 w-5 text-action-primary" aria-hidden={true} />
        <h2 id="player-stats-achievement-title" class="font-semibold text-text">
          {PLAYER_STATS_COPY.achievementTitle}
        </h2>
      </div>
      <SegmentedTabs
        defaultValue="rank"
        options={PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS}
        listClass="w-full sm:w-auto"
        triggerClass="flex-1 sm:flex-none"
      >
        <For each={PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS}>
          {(option) => (
            <AppTabContent value={option.value}>{renderGroup(option.value)}</AppTabContent>
          )}
        </For>
      </SegmentedTabs>
    </section>
  )
}

/**
 * ヒートマップセルのテーマ連動背景色を生成する。
 *
 * @param count - 達成件数。
 * @param total - レベル内の全譜面数。
 * @returns color-mixを使った背景色。
 */
const getHeatmapBackground = (count: number, total: number): string => {
  const percent = total > 0 ? count / total : 0
  const mixPercent = Math.round(percent * PLAYER_STATS_HEATMAP_MAX_MIX_PERCENT)
  return `color-mix(in srgb, var(--cs-color-action-primary) ${mixPercent}%, var(--cs-color-surface))`
}

/**
 * 達成率分布行の達成セルを達成数と総数の2段で表示する。
 *
 * @param props.row - 表示する達成率分布行。
 * @param props.metric - 表示する到達条件。
 * @returns 色の濃淡と数値を併用した表セル。
 */
const HeatmapCell = (props: {
  row: PlayerStatsHeatmapRow
  metric: PlayerStatsLevelAchievement
}): JSX.Element => {
  const count = () => props.row[props.metric]
  return (
    <td
      class="min-w-16 border-l border-border px-2 py-1.5 text-center"
      style={{ background: getHeatmapBackground(count(), props.row.total) }}
    >
      <span class="block font-jost text-sm font-semibold leading-tight tabular-nums text-text">
        {formatInteger(count())}
      </span>
      <span class="block font-jost text-xs leading-tight tabular-nums text-text-muted">
        {PLAYER_STATS_COPY.heatmapCountSeparator}
        {formatInteger(props.row.total)}
      </span>
    </td>
  )
}

/**
 * 選択した集計軸ごとの達成率を表形式で表示する。
 *
 * @param props.group - RANK、COMBO、HARDのいずれか。
 * @param props.rows - 集計軸の値が高い順の統計行。
 * @param props.caption - 表の読み上げ用説明。
 * @returns 横スクロール可能なアクセシブルデータ表。
 */
const HeatmapTable = (props: {
  group: PlayerStatsAchievementGroup
  rows: (PlayerStatsLevelRow | PlayerStatsChartConstantRow)[]
  caption: string
}): JSX.Element => (
  <div class="mt-4 overflow-x-auto rounded-lg border border-border">
    <table class="w-full min-w-[34rem] border-collapse">
      <caption class="sr-only">{props.caption}</caption>
      <thead class="bg-surface-muted text-xs text-text-muted">
        <tr>
          <th scope="col" class="px-3 py-2 text-center font-semibold">
            <span class="sr-only">{PLAYER_STATS_COPY.achievementTitle}</span>
          </th>
          <For each={props.rows}>
            {(row) => (
              <th
                scope="col"
                class="border-l border-border px-3 py-2 text-center font-jost font-semibold"
              >
                {'level' in row ? row.level : formatChartConst(row.chartConstant)}
              </th>
            )}
          </For>
        </tr>
      </thead>
      <tbody>
        <For each={PLAYER_STATS_HEATMAP_METRICS[props.group]}>
          {(metric) => (
            <tr class="border-t border-border">
              <th scope="row" class="px-3 py-2 text-center font-semibold text-text">
                {metric.label}
              </th>
              <For each={props.rows}>{(row) => <HeatmapCell row={row} metric={metric.key} />}</For>
            </tr>
          )}
        </For>
      </tbody>
    </table>
  </div>
)

/**
 * レベル別と譜面定数別の達成率分布をサブタブで切り替える。
 *
 * @param props.levelRows - レベルが高い順の統計行。
 * @param props.chartConstantRows - 譜面定数が高い順の統計行。
 * @returns 達成種別と集計軸を切り替えられる達成率分布表。
 */
const AchievementHeatmap = (props: {
  levelRows: PlayerStatsLevelRow[]
  chartConstantRows: PlayerStatsChartConstantRow[]
}): JSX.Element => {
  const [axis, setAxis] = createSignal<PlayerStatsHeatmapAxis>('level')
  const axisTabs = (
    <SegmentedToggleGroup
      value={axis()}
      onChange={setAxis}
      options={PLAYER_STATS_HEATMAP_AXIS_OPTIONS}
      class="w-full sm:w-auto"
      itemClass="flex-1 sm:flex-none"
    />
  )

  return (
    <section class={PAGE_SECTION_CLASS} aria-labelledby="player-stats-heatmap-title">
      <div class="mb-4 flex items-center gap-2">
        <Grid3X3 class="h-5 w-5 shrink-0 text-action-primary" aria-hidden={true} />
        <h2 id="player-stats-heatmap-title" class="font-semibold text-text">
          {PLAYER_STATS_COPY.heatmapTitle}
        </h2>
      </div>
      <SegmentedTabs
        defaultValue="rank"
        options={PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS}
        listClass="w-full sm:w-auto"
        listWrapperClass="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        listAside={axisTabs}
        triggerClass="flex-1 sm:flex-none"
      >
        <For each={PLAYER_STATS_ACHIEVEMENT_GROUP_OPTIONS}>
          {(option) => (
            <AppTabContent value={option.value}>
              <HeatmapTable
                group={option.value}
                rows={axis() === 'level' ? props.levelRows : props.chartConstantRows}
                caption={
                  axis() === 'level'
                    ? PLAYER_STATS_COPY.levelCaption
                    : PLAYER_STATS_COPY.chartConstantCaption
                }
              />
            </AppTabContent>
          )}
        </For>
      </SegmentedTabs>
    </section>
  )
}

/**
 * 目標種別に対応する現在の達成件数をサマリーから取得する。
 *
 * @param summary - 選択難易度のサマリー。
 * @param target - SSS+、AJ、MAXのいずれか。
 * @returns 対象目標の現在件数。
 */
const getTargetCurrentCount = (
  summary: PlayerStatsSummary,
  target: PlayerStatsCandidateTarget
): number => (target === 'sssPlus' ? summary.sssPlus : target === 'aj' ? summary.aj : summary.max)

/**
 * 次の区切りとなる達成曲数を3種類並べて表示する。
 *
 * @param props.summary - 選択難易度のサマリー。
 * @returns SSS+、AJ、MAXのマイルストーンカード。
 */
const MilestoneCards = (props: { summary: PlayerStatsSummary }): JSX.Element => (
  <section class={PAGE_SECTION_CLASS} aria-labelledby="player-stats-milestone-title">
    <div class="mb-4 flex items-center gap-2">
      <Target class="h-5 w-5 text-action-primary" aria-hidden={true} />
      <h2 id="player-stats-milestone-title" class="font-semibold text-text">
        {PLAYER_STATS_COPY.milestoneTitle}
      </h2>
    </div>
    <ul class="grid gap-3 sm:grid-cols-3">
      <For each={PLAYER_STATS_MILESTONE_OPTIONS}>
        {(option) => {
          const milestone = () =>
            buildPlayerStatsMilestone(
              getTargetCurrentCount(props.summary, option.value),
              option.value,
              props.summary.total
            )
          return (
            <li class="rounded-lg border border-border bg-surface-muted p-3">
              <p class="text-sm font-semibold text-text">{option.label}</p>
              <p class="mt-2 font-jost text-2xl font-semibold tabular-nums text-action-primary">
                <Show when={!milestone().isComplete} fallback={PLAYER_STATS_COPY.milestoneComplete}>
                  {PLAYER_STATS_COPY.milestoneRemainingPrefix}
                  {formatInteger(milestone().remaining)}
                  <span class="ml-1 text-sm text-text-muted">
                    {PLAYER_STATS_COPY.milestoneRemainingSuffix}
                  </span>
                </Show>
              </p>
              <p class="mt-1 text-xs text-text-muted">
                <Show
                  when={!milestone().isComplete}
                  fallback={`${formatInteger(milestone().current)} / ${formatInteger(props.summary.total)} ${PLAYER_STATS_COPY.achievementCountSuffix}`}
                >
                  {formatInteger(milestone().target)}
                  {PLAYER_STATS_COPY.milestoneTargetSuffix}
                </Show>
              </p>
            </li>
          )
        }}
      </For>
    </ul>
  </section>
)

/**
 * 候補譜面の現在状態を目標種別に合わせて表示する。
 *
 * @param candidate - 表示対象の候補譜面。
 * @returns スコア差、AJ済みMAX候補のJUSTICE数、またはAJ候補理由の表示。
 */
const formatCandidateStatus = (candidate: PlayerStatsCandidate): string => {
  if (candidate.justiceGap !== null) {
    return `${PLAYER_STATS_COPY.scoreGapPrefix}${formatInteger(candidate.justiceGap)}${PLAYER_STATS_COPY.justiceGapSuffix}`
  }
  if (candidate.scoreGap !== null) {
    return `${PLAYER_STATS_COPY.scoreGapPrefix}${formatInteger(candidate.scoreGap)}${PLAYER_STATS_COPY.scoreGapSuffix}`
  }
  if (candidate.record.combo_lamp === 'FULL COMBO') return PLAYER_STATS_COPY.fullComboCandidate
  return `${PLAYER_STATS_COPY.currentRankPrefix} ${getScoreRank(candidate.record.score)}`
}

/**
 * 目標達成に近い譜面1件を楽曲詳細へのリンク付きで表示する。
 *
 * @param props.candidate - 候補譜面と残りスコア。
 * @returns 譜面情報、現在スコア、目標までの状態を含む行。
 */
const CandidateRow = (props: { candidate: PlayerStatsCandidate }): JSX.Element => {
  const constDisplay = () =>
    getConstDisplay(props.candidate.record.const, props.candidate.record.is_const_unknown)
  return (
    <li>
      <A
        href={buildSongDetailPath(props.candidate.record.id, props.candidate.record.difficulty)}
        class="grid h-full gap-3 rounded-lg border border-border bg-surface-muted p-3 transition-colors hover:border-action-primary-border hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
      >
        <div class="min-w-0">
          <p class="truncate font-sans text-sm font-semibold text-text">
            {props.candidate.record.title}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={props.candidate.record.difficulty} compact />
            <span class={`font-oswald text-sm tabular-nums ${constDisplay().className}`}>
              {constDisplay().valueText}
              {constDisplay().markerText}
            </span>
          </div>
        </div>
        <div class="text-left sm:text-right">
          <p class="font-oswald text-lg font-semibold tabular-nums text-text">
            {formatInteger(props.candidate.record.score)}
          </p>
          <p class="text-xs font-semibold text-action-primary">
            {formatCandidateStatus(props.candidate)}
          </p>
        </div>
      </A>
    </li>
  )
}

/**
 * 指定目標の候補譜面一覧を表示する。
 *
 * @param props.records - 選択難易度の通常譜面レコード。
 * @param props.target - SSS+、AJ、MAXのいずれか。
 * @param props.notesBySongId - 曲IDと難易度ごとのノーツ数。
 * @returns 上位候補譜面一覧または空表示。
 */
const CandidateList = (props: {
  records: PlayerRecordDTO[]
  target: PlayerStatsCandidateTarget
  notesBySongId: PlayerStatsNotesBySongId
}): JSX.Element => {
  const candidates = () =>
    findPlayerStatsCandidates(
      props.records,
      props.target,
      PLAYER_STATS_CANDIDATE_LIMIT,
      props.notesBySongId
    )
  return (
    <Show
      when={candidates().length > 0 ? candidates() : undefined}
      fallback={
        <p class="rounded-lg border border-border bg-surface-muted px-4 py-8 text-center text-sm text-text-muted">
          {PLAYER_STATS_COPY.candidateEmpty}
        </p>
      }
    >
      {(items) => (
        <ul class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          <For each={items()}>{(candidate) => <CandidateRow candidate={candidate} />}</For>
        </ul>
      )}
    </Show>
  )
}

/**
 * SSS+、AJ、MAXの次の候補譜面をタブで表示する。
 *
 * @param props.records - 選択難易度の通常譜面レコード。
 * @param props.notesBySongId - 曲IDと難易度ごとのノーツ数。
 * @returns 目標別の候補譜面一覧。
 */
const CandidateSection = (props: {
  records: PlayerRecordDTO[]
  notesBySongId: PlayerStatsNotesBySongId
}): JSX.Element => (
  <section class={PAGE_SECTION_CLASS} aria-labelledby="player-stats-candidate-title">
    <div class="mb-4 flex items-center gap-2">
      <Trophy class="h-5 w-5 text-action-primary" aria-hidden={true} />
      <h2 id="player-stats-candidate-title" class="font-semibold text-text">
        {PLAYER_STATS_COPY.candidateTitle}
      </h2>
    </div>
    <SegmentedTabs
      defaultValue="sssPlus"
      options={PLAYER_STATS_CANDIDATE_OPTIONS}
      listClass="mb-4 w-full sm:w-auto"
      triggerClass="flex-1 sm:flex-none"
    >
      <For each={PLAYER_STATS_CANDIDATE_OPTIONS}>
        {(option) => (
          <AppTabContent value={option.value}>
            <CandidateList
              records={props.records}
              target={option.value}
              notesBySongId={props.notesBySongId}
            />
          </AppTabContent>
        )}
      </For>
    </SegmentedTabs>
  </section>
)

/**
 * ログインユーザーの通常譜面レコードを分析する統計ダッシュボードを表示する。
 *
 * @returns 難易度連動の概要、達成階段、ヒートマップ、目標候補を含むページ。
 */
const PlayerStatsDashboardPage: Component = () => {
  const [difficulty, setDifficulty] = createSignal<PlayerStatsDifficulty>(
    PLAYER_STATS_DEFAULT_DIFFICULTY
  )
  const [pageData] = createResource(fetchPlayerStatsPageData)
  const filteredRecords = createMemo(() =>
    filterPlayerStatsRecords(
      pageData()?.records ?? [],
      difficulty(),
      pageData()?.targetDifficultyBySongId
    )
  )
  const summary = createMemo(() => buildPlayerStatsSummary(filteredRecords()))
  const levelRows = createMemo(() => buildPlayerStatsLevelRows(filteredRecords()))
  const chartConstantRows = createMemo(() => buildPlayerStatsChartConstantRows(filteredRecords()))
  const selectedDifficultyOption = createMemo(
    () =>
      PLAYER_STATS_DIFFICULTY_OPTIONS.find((option) => option.value === difficulty()) ??
      PLAYER_STATS_DIFFICULTY_OPTIONS[0]
  )

  useDocumentTitle(PLAYER_STATS_COPY.documentTitle)

  return (
    <ErrorBoundary
      fallback={(error) => (
        <div class="mx-auto w-full max-w-7xl p-4">
          <LoadError error={error} />
        </div>
      )}
    >
      <Show when={pageData()} fallback={<Loading />}>
        {(data) => (
          <Show when={data().records.length > 0} fallback={<PlayerDataEmptyState />}>
            <main class="mx-auto w-full max-w-7xl space-y-4 p-4 sm:space-y-6">
              <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 class="text-2xl font-semibold text-text">{PLAYER_STATS_COPY.pageTitle}</h1>
                  <p class="mt-1 font-sans text-sm text-text-muted">{data().username}</p>
                  <p class="mt-1 text-xs text-text-subtle">
                    {PLAYER_STATS_COPY.updatedAt}: {formatUpdatedAt(data().updatedAt)}
                  </p>
                </div>
                <AppSelect<PlayerStatsDifficultyOption>
                  rootClass="w-full sm:w-48"
                  options={PLAYER_STATS_DIFFICULTY_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={selectedDifficultyOption()}
                  onChange={(option) => option && setDifficulty(option.value)}
                  label={PLAYER_STATS_COPY.difficultyLabel}
                  formatLabel={(option) => option.label}
                />
              </header>

              <SummaryCards summary={summary()} />

              <div class="grid gap-4 lg:grid-cols-2 lg:items-start sm:gap-6">
                <AchievementSection records={filteredRecords()} />
                <MilestoneCards summary={summary()} />
              </div>

              <AchievementHeatmap levelRows={levelRows()} chartConstantRows={chartConstantRows()} />
              <CandidateSection records={filteredRecords()} notesBySongId={data().notesBySongId} />
            </main>
          </Show>
        )}
      </Show>
    </ErrorBoundary>
  )
}

export default PlayerStatsDashboardPage
