import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { A } from '@solidjs/router'
import ArrowUpDown from 'lucide-solid/icons/arrow-up-down'
import ChevronRight from 'lucide-solid/icons/chevron-right'
import CircleSlash2 from 'lucide-solid/icons/circle-slash-2'
import Dices from 'lucide-solid/icons/dices'
import Funnel from 'lucide-solid/icons/funnel'
import ListFilter from 'lucide-solid/icons/list-filter'
import RotateCcw from 'lucide-solid/icons/rotate-ccw'
import X from 'lucide-solid/icons/x'
import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js'
import placeholderImageUrl from '../../../../assets/placeholder.webp'
import { LoadError, Loading } from '../../../../components'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../../../components/common/AppButton'
import { AppDialog } from '../../../../components/common/AppDialog'
import { AppSelect } from '../../../../components/common/AppSelect'
import { AppTooltipIconButton } from '../../../../components/common/AppTooltipIconButton'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import { CourseChartDifficultyBadge } from '../../../../components/common/course/CourseChartDifficultyBadge'
import FilterResetDialog from '../../../../components/common/FilterResetDialog'
import { SONG_FILTER_INPUT_CLASS } from '../../../../components/common/filterStyles'
import { JacketImage } from '../../../../components/common/JacketImage'
import { TextRangeInput } from '../../../../components/common/RangeInput'
import { RecordLampDots } from '../../../../components/common/record/RecordDisplayParts'
import { SearchTextField } from '../../../../components/common/SearchTextField'
import { SongSelectionVirtualList } from '../../../../components/common/songSelection/SongSelectionDialogBase'
import {
  getSongSelectionToolbarButtonClass,
  SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS,
} from '../../../../components/common/songSelection/songSelectionDialog'
import { WORLDSEND_SCORE_LABEL } from '../../../../constants/chart'
import {
  COURSE_TRACK_NUMBERS,
  COURSE_TRACK_SELECTION_LABELS,
} from '../../../../constants/courseTracks'
import { getCoursePickKeys, saveCoursePickKeys } from '../../../../stores/coursePicks'
import type { CourseDetailDTO, CourseTrackCandidateDTO } from '../../../../types/api'
import { toChartLevelLabel } from '../../../../utils/chartLevel'
import {
  type CourseCandidateDifficulty,
  type CourseCandidateFilter,
  type CourseCandidateSort,
  type CourseCandidateSortKey,
  filterAndSortCourseCandidates,
  listCourseCandidateDifficulties,
  pickRandomCourseCandidate,
  resolveCoursePicks,
} from '../../../../utils/courseTrackCandidates'
import {
  type CourseTrackBestRecord,
  courseChartKey,
  formatCourseTrackFilter,
  formatCourseWorldsendChart,
  getCourseTrackSongPath,
} from '../../../../utils/courseTracks'
import { buildChunithmJacketUrl } from '../../../../utils/jacket'
import { normalizeScoreRangeInput } from '../../../../utils/rangeInput'
import { formatScoreDifference, getScoreDifferenceClass } from '../../../../utils/scoreDifference'
import type { SortDirection } from '../../../../utils/sortingQuery'
import { COURSE_PAGE_COPY } from '../../constants'

type Track = CourseDetailDTO['tracks'][number]

type Props = {
  /** 選曲をコースごとに保持するためのコースID */
  courseId: string
  tracks: readonly Track[]
  loading: boolean
  error: unknown
  records?: ReadonlyMap<string, CourseTrackBestRecord>
  scoreError: boolean
  /** 自分のコーススコア。未プレイ・未ログイン時は undefined */
  ownCourseScore?: number
}

const COPY = COURSE_PAGE_COPY.tracks

/** コース楽曲カードの共通外枠クラス */
const TRACK_CARD_SURFACE_CLASS =
  'flex h-full min-w-0 items-center gap-3.5 rounded-lg border border-border bg-surface p-3'

/** カード右側の、ヘッダー・曲名・スコアを縦に並べる列のクラス */
const TRACK_CARD_BODY_CLASS = 'flex min-w-0 flex-1 flex-col gap-1.5'

/** 楽曲詳細へ遷移する固定譜面カード用のインタラクティブクラス */
const TRACK_CARD_LINK_CLASS = `${TRACK_CARD_SURFACE_CLASS} transition-colors hover:border-action-primary/60 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring`

/** 選曲済みランダム枠の内側に置く楽曲詳細リンクのクラス。外枠はランダム枠カードが持つ */
const TRACK_CARD_INNER_LINK_CLASS =
  'flex min-w-0 items-center gap-3.5 rounded-t-lg p-3 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * 譜面定数またはWORLD'S ENDの譜面表記を返す。
 *
 * @param chart - 表示対象の候補譜面。
 * @returns 譜面定数、またはWORLD'S ENDの譜面情報。
 */
const formatChartMetaLabel = (chart: CourseTrackCandidateDTO): string => {
  // コース詳細では属性と星数だけで足りるため、ノーツ数は表示しない
  if (chart.difficulty === 'WORLDSEND') return formatCourseWorldsendChart({ ...chart, notes: null })
  return chart.is_const_unknown ? `Lv.${toChartLevelLabel(chart.const)}` : chart.const.toFixed(1)
}

/**
 * 難易度バッジと譜面定数（またはWORLD'S END表記）を横並びで表示する。
 *
 * @param props - 表示対象の候補譜面。
 * @returns 難易度と譜面定数の表示。
 */
const TrackChartMeta = (props: { chart: CourseTrackCandidateDTO }) => (
  <span class="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
    <CourseChartDifficultyBadge difficulty={props.chart.difficulty} />
    <span
      class={
        props.chart.difficulty === 'WORLDSEND'
          ? 'font-sans text-xs text-text-muted'
          : 'font-jost text-sm font-medium leading-none text-text tabular-nums'
      }
    >
      {formatChartMetaLabel(props.chart)}
    </span>
  </span>
)

/**
 * 譜面の自己ベストスコアとランプのドット（または未プレイ）を右寄せで縦に並べて表示する。
 *
 * @param props - 取得済みレコード。
 * @returns スコアとランプバッジの表示。
 */
const TrackOwnBest = (props: { record?: CourseTrackBestRecord }) => (
  <Show
    when={props.record}
    fallback={
      <div class="flex justify-end">
        <span class="text-xs text-text-muted">{COURSE_PAGE_COPY.notPlayed}</span>
      </div>
    }
  >
    {(record) => (
      <div class="flex flex-col items-end gap-1.5">
        <p class="flex items-baseline gap-2">
          <span class="text-xs text-text-muted">{COPY.best}</span>
          <span class="font-jost text-lg font-semibold leading-none text-text tabular-nums">
            {record().score.toLocaleString('ja-JP')}
          </span>
        </p>
        <RecordLampDots record={record()} />
      </div>
    )}
  </Show>
)

/**
 * 候補譜面ダイアログ内の1件分の行を表示する。
 * 行本体のクリックで選曲し、右端のリンクから楽曲詳細へ移動する。
 * 上段に曲名と譜面情報、下段右にスコアとランプを固定して並べ、行ごとの崩れを防ぐ。
 *
 * @param props - 候補譜面、取得済みレコード、選曲中かどうか、選曲時の処理。
 * @returns 候補1件の表示。
 */
const CandidateRow = (props: {
  chart: CourseTrackCandidateDTO
  records?: ReadonlyMap<string, CourseTrackBestRecord>
  selected: boolean
  onSelect: (chart: CourseTrackCandidateDTO) => void
}) => {
  const record = () => props.records?.get(courseChartKey(props.chart))
  return (
    <div
      class={`flex min-w-0 items-center rounded-md transition-colors ${
        props.selected ? 'bg-success-bg' : 'hover:bg-surface-hover'
      }`}
    >
      <Button
        type="button"
        aria-current={props.selected ? 'true' : undefined}
        onClick={() => props.onSelect(props.chart)}
        class="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1.5 py-2.5 text-left sm:gap-3.5 sm:px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
      >
        <JacketImage
          source={buildChunithmJacketUrl(props.chart.jacket) ?? undefined}
          alt=""
          ariaHidden
          class="size-14 shrink-0 overflow-hidden rounded-md bg-surface-muted ring-1 ring-border/50"
          imageClass="size-full object-cover"
          fallback={<img src={placeholderImageUrl} alt="" class="size-full object-cover" />}
        />
        <span class="flex min-w-0 flex-1 flex-col gap-2">
          <span class="flex items-center justify-between gap-2">
            <span class="min-w-0 truncate font-sans text-sm font-semibold leading-snug text-action-primary">
              {props.chart.title}
            </span>
            <TrackChartMeta chart={props.chart} />
          </span>
          <Show when={props.records}>
            <span class="flex items-center justify-end gap-2">
              <Show
                when={record()}
                fallback={<span class="text-xs text-text-muted">{COURSE_PAGE_COPY.notPlayed}</span>}
              >
                {(best) => (
                  <>
                    <span class="font-jost text-base font-semibold leading-none text-text tabular-nums">
                      <span class="sr-only">{COPY.ownBest} </span>
                      {best().score.toLocaleString('ja-JP')}
                    </span>
                    <RecordLampDots record={best()} />
                  </>
                )}
              </Show>
            </span>
          </Show>
        </span>
      </Button>
      <A
        href={getCourseTrackSongPath(props.chart)}
        aria-label={`${props.chart.title} ${COPY.openSongDetail}`}
        title={COPY.openSongDetail}
        class={getAppIconButtonClass({
          tone: 'ghost',
          class: 'mr-1 shrink-0 focus-visible:ring-inset',
        })}
      >
        <ChevronRight size={18} aria-hidden="true" />
      </A>
    </div>
  )
}

/** 候補譜面の並び替えキーの選択肢 */
const CANDIDATE_SORT_OPTIONS: { value: CourseCandidateSortKey; label: string }[] = [
  { value: 'default', label: COPY.candidateSortDefault },
  { value: 'title', label: COPY.candidateSortTitle },
  { value: 'const', label: COPY.candidateSortConst },
  { value: 'score', label: COPY.candidateSortScore },
]

/** 候補譜面の並び替え方向の選択肢 */
const CANDIDATE_SORT_DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'asc', label: COPY.candidateSortAsc },
  { value: 'desc', label: COPY.candidateSortDesc },
]

/** 候補一覧から開くフィルター・並び替えダイアログの共通設定 */
const CANDIDATE_OPTION_DIALOG_PROPS = {
  placement: 'sheet',
  size: 'md',
  height: 'max80',
  layer: 'stacked',
  scroll: 'grow',
} as const

/**
 * 候補一覧から開くフィルター・並び替えダイアログの、条件を適用して閉じるフッター。
 *
 * @returns 適用ボタンを置いたフッター。
 */
const CandidateOptionDialogFooter = () => (
  <div class="mt-6 flex justify-end">
    <Dialog.CloseButton class={getAppButtonClass({ variant: 'primary' })}>
      {COPY.candidateFilterApply}
    </Dialog.CloseButton>
  </div>
)

/**
 * 候補譜面の難易度をフィルターの選択肢名へ変換する。
 *
 * @param difficulty - 候補譜面の難易度。
 * @returns 画面に表示する難易度名。
 */
const candidateDifficultyLabel = (difficulty: CourseCandidateDifficulty): string =>
  difficulty === 'WORLDSEND' ? WORLDSEND_SCORE_LABEL : difficulty

/**
 * 候補譜面を検索・難易度/スコアで絞り込み、1つのキーで並べ替えて仮想化一覧で表示する。
 * 条件はダイアログを開いている間だけ保持する。
 * スクロール要素はドキュメントへ挿入されてから仮想化を始める。
 *
 * @param props - 候補譜面、取得済みレコード、選曲中の譜面、選曲時の処理。
 * @returns 検索・フィルター・並び替えの操作と候補譜面のスクロール一覧。
 */
const CandidateBrowser = (props: {
  candidates: readonly CourseTrackCandidateDTO[]
  records?: ReadonlyMap<string, CourseTrackBestRecord>
  picked?: CourseTrackCandidateDTO
  onSelect: (chart: CourseTrackCandidateDTO) => void
}) => {
  const [scrollElement, setScrollElement] = createSignal<HTMLDivElement>()
  const [filterDialogOpen, setFilterDialogOpen] = createSignal(false)
  const difficulties = createMemo(() => listCourseCandidateDifficulties(props.candidates))
  const defaultFilter = (): CourseCandidateFilter => ({
    query: '',
    difficulties: difficulties(),
    scoreMin: '',
    scoreMax: '',
  })
  const [filter, setFilter] = createSignal(defaultFilter())
  const [sort, setSort] = createSignal<CourseCandidateSort>({ key: 'default', direction: 'asc' })
  const filterChanged = () =>
    filter().difficulties.length !== difficulties().length ||
    filter().scoreMin !== '' ||
    filter().scoreMax !== ''
  const filterLabel = () => (filterChanged() ? COPY.candidateFilterActive : COPY.candidateFilter)
  const [sortDialogOpen, setSortDialogOpen] = createSignal(false)
  /** @returns 標準順以外で並べ替えているか。 */
  const sortChanged = () => sort().key !== 'default'
  /** @returns 並び替えボタンの操作名。 */
  const sortLabel = () => (sortChanged() ? COPY.candidateSortActive : COPY.candidateSort)
  // 自己ベスト未取得時はスコア条件が意味を持たないため、並び替えの選択肢からも外す
  const sortOptions = () =>
    props.records
      ? CANDIDATE_SORT_OPTIONS
      : CANDIDATE_SORT_OPTIONS.filter((o) => o.value !== 'score')
  const items = createMemo(() =>
    filterAndSortCourseCandidates(props.candidates, props.records, filter(), sort())
  )

  /**
   * 難易度の選択状態を切り替える。選択順は候補内の正規順に揃える。
   *
   * @param difficulty - 切り替える難易度。
   * @param checked - 選択するか。
   * @returns なし。
   */
  const toggleDifficulty = (difficulty: CourseCandidateDifficulty, checked: boolean): void => {
    setFilter((current) => ({
      ...current,
      difficulties: difficulties().filter((item) =>
        item === difficulty ? checked : current.difficulties.includes(item)
      ),
    }))
  }

  return (
    <>
      <div class="flex shrink-0 min-w-0 items-center">
        <SearchTextField
          class="min-w-0 flex-1"
          frameClass="rounded-l"
          value={filter().query}
          active={filter().query.trim().length > 0}
          onChange={(query) => setFilter((current) => ({ ...current, query }))}
          ariaLabel={COPY.candidateSearchLabel}
          placeholder={COPY.candidateSearchPlaceholder}
        />
        <Button
          type="button"
          class={getSongSelectionToolbarButtonClass(filterChanged(), false)}
          aria-label={filterLabel()}
          aria-pressed={filterChanged()}
          title={filterLabel()}
          onClick={() => setFilterDialogOpen(true)}
        >
          <Funnel size={20} aria-hidden="true" />
        </Button>
        <Button
          type="button"
          class={getSongSelectionToolbarButtonClass(sortChanged(), true)}
          aria-label={sortLabel()}
          aria-pressed={sortChanged()}
          title={sortLabel()}
          onClick={() => setSortDialogOpen(true)}
        >
          <ArrowUpDown size={20} aria-hidden="true" />
        </Button>
      </div>
      <div
        // ポータル挿入前の要素では仮想化が画面のサイズとスクロールを監視できないため、挿入後に渡す
        ref={(element) => queueMicrotask(() => setScrollElement(element))}
        // スマホ幅ではダイアログ共通の余白を打ち消し、曲名の表示幅を確保する
        class="-mx-3 mt-3 min-h-0 flex-1 basis-0 overflow-y-auto overscroll-contain scrollbar-none sm:mx-0"
      >
        <Show
          when={items().length > 0}
          fallback={
            <div class="flex min-h-32 flex-col items-center justify-center gap-2 p-8 text-text-subtle">
              <CircleSlash2 class="h-6 w-6" aria-hidden="true" />
              <p class="text-sm">{COPY.candidateEmpty}</p>
            </div>
          }
        >
          <Show when={scrollElement()}>
            {(element) => (
              <SongSelectionVirtualList
                items={items()}
                getScrollElement={element}
                renderItem={(candidate) => (
                  <div class="py-0.5">
                    <CandidateRow
                      chart={candidate}
                      records={props.records}
                      selected={candidate === props.picked}
                      onSelect={props.onSelect}
                    />
                  </div>
                )}
              />
            )}
          </Show>
        </Show>
      </div>

      <AppDialog
        open={filterDialogOpen()}
        onOpenChange={setFilterDialogOpen}
        {...CANDIDATE_OPTION_DIALOG_PROPS}
        title={COPY.candidateFilter}
        headerActions={
          <FilterResetDialog
            onReset={() => setFilter((current) => ({ ...defaultFilter(), query: current.query }))}
            showShortcutHint={false}
            layer="modal"
          />
        }
        bodyClass="space-y-5 text-sm"
        footer={<CandidateOptionDialogFooter />}
      >
        <fieldset class="min-w-0">
          <legend class="mb-2 text-sm font-medium">{COPY.candidateDifficulty}</legend>
          <div class="flex flex-col gap-2">
            <For each={difficulties()}>
              {(difficulty) => (
                <CheckboxField
                  checked={filter().difficulties.includes(difficulty)}
                  label={candidateDifficultyLabel(difficulty)}
                  textVariant="large"
                  onChange={(checked) => toggleDifficulty(difficulty, checked)}
                />
              )}
            </For>
          </div>
        </fieldset>
        <Show when={props.records}>
          <TextRangeInput
            title={COPY.candidateScore}
            inputClass={SONG_FILTER_INPUT_CLASS}
            start={{
              id: 'course-candidate-score-min',
              label: COPY.candidateScoreMin,
              value: filter().scoreMin,
              inputMode: 'numeric',
              normalizeInput: normalizeScoreRangeInput,
              onChange: (scoreMin) => setFilter((current) => ({ ...current, scoreMin })),
            }}
            end={{
              id: 'course-candidate-score-max',
              label: COPY.candidateScoreMax,
              value: filter().scoreMax,
              inputMode: 'numeric',
              normalizeInput: normalizeScoreRangeInput,
              onChange: (scoreMax) => setFilter((current) => ({ ...current, scoreMax })),
            }}
          />
        </Show>
      </AppDialog>

      <AppDialog
        open={sortDialogOpen()}
        onOpenChange={setSortDialogOpen}
        {...CANDIDATE_OPTION_DIALOG_PROPS}
        title={COPY.candidateSort}
        bodyClass="text-sm"
        footer={<CandidateOptionDialogFooter />}
      >
        <div class="flex min-w-0 items-end gap-2">
          <AppSelect
            options={sortOptions()}
            optionValue="value"
            optionTextValue="label"
            value={sortOptions().find((option) => option.value === sort().key)}
            onChange={(option) => {
              if (option) setSort((current) => ({ ...current, key: option.value }))
            }}
            label={COPY.candidateSortKey}
            formatLabel={(option) => option.label}
            rootClass="min-w-0 flex-1"
            contentZIndexClass={SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
            triggerClass="h-9.5"
          />
          <AppSelect
            options={CANDIDATE_SORT_DIRECTION_OPTIONS}
            optionValue="value"
            optionTextValue="label"
            value={CANDIDATE_SORT_DIRECTION_OPTIONS.find(
              (option) => option.value === sort().direction
            )}
            onChange={(option) => {
              if (option) setSort((current) => ({ ...current, direction: option.value }))
            }}
            disabled={sort().key === 'default'}
            label={COPY.candidateSortDirection}
            formatLabel={(option) => option.label}
            rootClass="w-28 shrink-0"
            contentZIndexClass={SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
            triggerClass="h-9.5"
          />
        </div>
      </AppDialog>
    </>
  )
}

/**
 * 楽曲詳細へ遷移する譜面カードの中身を表示する。ジャケット、曲名、譜面情報、自己ベストを並べる。
 *
 * @param props - 表示する譜面、取得済みレコード、リンクに付けるクラス。
 * @returns 楽曲詳細へのリンク。
 */
const TrackChartLink = (props: {
  chart: CourseTrackCandidateDTO
  records?: ReadonlyMap<string, CourseTrackBestRecord>
  class: string
}) => (
  <A href={getCourseTrackSongPath(props.chart)} class={props.class}>
    <JacketImage
      source={buildChunithmJacketUrl(props.chart.jacket) ?? undefined}
      alt=""
      ariaHidden
      class="size-20 shrink-0 self-start overflow-hidden rounded-md bg-surface-muted ring-1 ring-border/50"
      imageClass="size-full object-cover"
      fallback={<img src={placeholderImageUrl} alt="" class="size-full object-cover" />}
    />
    {/* 曲名とラベルを上端、スコアとランプを右下に寄せる */}
    <div class={`${TRACK_CARD_BODY_CLASS} self-stretch justify-between`}>
      <div class="flex min-w-0 items-center gap-2">
        <span class="min-w-0 flex-1 truncate font-sans text-sm font-semibold leading-snug text-action-primary">
          {props.chart.title}
        </span>
        <TrackChartMeta chart={props.chart} />
      </div>
      <Show when={props.records}>
        {(records) => <TrackOwnBest record={records().get(courseChartKey(props.chart))} />}
      </Show>
    </div>
  </A>
)

/**
 * コースの1枠を表示する。
 * 固定譜面はカード全体を楽曲詳細へのリンクとする。
 * ランダム枠は条件と候補数を示し、ランダム選曲・候補一覧からの選曲・解除の操作を並べる。
 * 選曲済みのランダム枠は固定譜面と同じ譜面表示を上部に重ねる。
 *
 * @param props - トラック番号、トラック定義、自己ベストレコード、選曲中の譜面、選曲を変える処理。
 * @returns コースの1枠分のカード。
 */
const CourseTrackCard = (props: {
  number: number
  track?: Track
  records?: ReadonlyMap<string, CourseTrackBestRecord>
  picked?: CourseTrackCandidateDTO
  onPick: (chart: CourseTrackCandidateDTO | undefined) => void
}) => {
  const [dialogOpen, setDialogOpen] = createSignal(false)
  /** @returns この枠の候補譜面。未登録の枠は空。 */
  const candidates = () => props.track?.candidates ?? []
  const unavailable = createMemo(() => {
    const track = props.track
    if (!track || track.selection_type === 'RANDOM_FILTER') return []
    const candidateKeys = new Set(track.candidates.map(courseChartKey))
    return track.charts.filter((chart) => !candidateKeys.has(courseChartKey(chart)))
  })

  /** @returns 固定枠で先頭候補が取得できている場合の譜面。 */
  const fixedChart = () =>
    props.track?.selection_type === 'FIXED' ? props.track.candidates[0] : undefined

  /** @returns ランダム枠の条件表示。条件がない枠は選曲方式名。 */
  const randomLabel = () => {
    const track = props.track
    if (!track) return ''
    const label = COURSE_TRACK_SELECTION_LABELS[track.selection_type]
    return track.selection_type === 'RANDOM_FILTER'
      ? formatCourseTrackFilter(track.filter) || label
      : label
  }

  const unavailableBox = () => (
    <Show when={unavailable().length}>
      <div class="space-y-1 rounded border border-border bg-surface-muted p-2">
        <p class="text-xs text-text-muted">{COPY.unavailableChart}</p>
        <ul class="space-y-1">
          <For each={unavailable()}>
            {(chart) => (
              <li class="flex flex-wrap items-center gap-1.5">
                <CourseChartDifficultyBadge difficulty={chart.difficulty} />
                <span class="break-all font-mono text-xs text-text-muted">{chart.id}</span>
              </li>
            )}
          </For>
        </ul>
      </div>
    </Show>
  )

  return (
    <li class="relative flex min-w-0 flex-col gap-2">
      {/* カード左上に少しはみ出す番号バッジ。下のカードリンクのクリックを妨げないよう反応させない */}
      <span class="pointer-events-none absolute -left-2 -top-2 z-10 flex size-8 items-center justify-center rounded-full border border-border bg-surface-muted font-oswald text-base font-semibold leading-none text-text">
        <span class="sr-only">{COPY.trackPrefix} </span>
        {props.number}
      </span>
      <Switch>
        <Match when={!props.track}>
          <div class={TRACK_CARD_SURFACE_CLASS}>
            <span class="pl-4 text-xs text-text-muted">{COPY.unregistered}</span>
          </div>
        </Match>
        <Match when={props.track?.selection_type === 'FIXED'}>
          <Show
            when={fixedChart()}
            fallback={
              <Show when={unavailable().length === 0}>
                <div class={TRACK_CARD_SURFACE_CLASS}>
                  <p class="pl-4 text-sm text-text-muted">{COPY.noCandidates}</p>
                </div>
              </Show>
            }
          >
            {(chart) => (
              <TrackChartLink
                chart={chart()}
                records={props.records}
                class={TRACK_CARD_LINK_CLASS}
              />
            )}
          </Show>
        </Match>
        <Match when={props.track}>
          <div
            class={`flex h-full min-w-0 flex-col rounded-lg border bg-surface ${
              props.picked ? 'border-border' : 'border-dashed border-border-strong'
            }`}
          >
            <Show when={props.picked}>
              {(chart) => (
                <TrackChartLink
                  chart={chart()}
                  records={props.records}
                  class={TRACK_CARD_INNER_LINK_CLASS}
                />
              )}
            </Show>
            <div
              class={`flex min-w-0 items-center gap-2 ${
                props.picked ? 'border-t border-border py-0.5 pl-3 pr-1' : 'flex-1 py-3 pl-7 pr-2'
              }`}
            >
              <div
                class={`flex min-w-0 flex-1 ${
                  props.picked ? 'flex-wrap items-baseline gap-x-2' : 'flex-col gap-0.5'
                }`}
              >
                <p
                  class={`break-words font-sans ${
                    props.picked ? 'text-xs text-text-muted' : 'text-base font-semibold text-text'
                  }`}
                >
                  {randomLabel()}
                </p>
                <p class="text-xs text-text-muted">
                  {COPY.candidateCount}{' '}
                  <span class="font-jost tabular-nums">
                    {candidates().length.toLocaleString('ja-JP')}
                  </span>
                </p>
              </div>
              <Show
                when={candidates().length > 0}
                fallback={
                  <Show when={unavailable().length === 0}>
                    <p class="text-xs text-text-muted">{COPY.noCandidates}</p>
                  </Show>
                }
              >
                <div class="flex shrink-0 items-center gap-1">
                  <AppTooltipIconButton
                    label={COPY.pickRandom}
                    tone="ghost"
                    size={props.picked ? 'xs' : 'sm'}
                    onClick={() => props.onPick(pickRandomCourseCandidate(candidates()))}
                  >
                    <Dices size={props.picked ? 18 : 20} aria-hidden="true" />
                  </AppTooltipIconButton>
                  <AppTooltipIconButton
                    label={COPY.pickFromList}
                    tone="ghost"
                    size={props.picked ? 'xs' : 'sm'}
                    onClick={() => setDialogOpen(true)}
                  >
                    <ListFilter size={props.picked ? 18 : 20} aria-hidden="true" />
                  </AppTooltipIconButton>
                  <Show when={props.picked}>
                    <AppTooltipIconButton
                      label={COPY.clearPick}
                      tone="ghost"
                      size="xs"
                      onClick={() => props.onPick(undefined)}
                    >
                      <X size={18} aria-hidden="true" />
                    </AppTooltipIconButton>
                  </Show>
                </div>
                <AppDialog
                  open={dialogOpen()}
                  onOpenChange={setDialogOpen}
                  placement="viewport"
                  height="viewportFill"
                  title={`${COPY.trackPrefix} ${props.number} ${COPY.candidates}`}
                  closeLabel={COPY.closeCandidates}
                >
                  <CandidateBrowser
                    candidates={candidates()}
                    records={props.records}
                    picked={props.picked}
                    onSelect={(chart) => {
                      props.onPick(chart)
                      setDialogOpen(false)
                    }}
                  />
                </AppDialog>
              </Show>
            </div>
          </div>
        </Match>
      </Switch>
      {unavailableBox()}
    </li>
  )
}

/**
 * 各トラックの自己ベストを合計したコースのTOTALを求める。
 *
 * @param chartOf - トラック番号から、固定譜面または選曲済みの譜面を返す関数。
 * @param records - 自己ベストレコード。
 * @returns 全トラックの譜面が確定しプレイ済みの場合は合計スコア。それ以外は undefined。
 */
const totalBestScore = (
  chartOf: (number: number) => CourseTrackCandidateDTO | undefined,
  records: ReadonlyMap<string, CourseTrackBestRecord> | undefined
): number | undefined => {
  let total = 0
  for (const number of COURSE_TRACK_NUMBERS) {
    const chart = chartOf(number)
    const record = chart && records?.get(courseChartKey(chart))
    if (!record) return undefined
    total += record.score
  }
  return total
}

/**
 * コースを構成する3枠と現在選曲できる譜面を表示する。
 * ランダム枠は枠ごと、または見出し横のボタンでまとめて選曲できる。
 * 選曲はコースごとにストアへ保持し、楽曲詳細などへ移動して戻っても残す。リロードで消える。
 * コンテナ幅が十分な場合は3列、狭い場合は縦1列で配置する。
 *
 * @param props - コースID、コース詳細の取得状態と比較用の自己ベストレコード。
 * @returns コース楽曲セクション。
 */
const CourseTracksSection = (props: Props) => {
  /** @returns このコースで選曲中の譜面キー。 */
  const pickKeys = () => getCoursePickKeys(props.courseId)
  /** 再取得で譜面オブジェクトが作り直されても選曲を保つため、キーから現在の候補を引き直す */
  const picks = createMemo(() => resolveCoursePicks(props.tracks, pickKeys()))

  /**
   * @param number - トラック番号。
   * @returns その番号のトラック定義。未登録は undefined。
   */
  const trackOf = (number: number) => props.tracks.find((track) => track.track_no === number)
  /** @returns 候補が1件以上あるランダム枠。 */
  const randomTracks = () =>
    props.tracks.filter((track) => track.selection_type !== 'FIXED' && track.candidates.length > 0)

  /**
   * 1枠分の選曲を設定または解除する。
   *
   * @param number - トラック番号。
   * @param chart - 選曲する譜面。undefined で解除する。
   * @returns なし。
   */
  const setPick = (number: number, chart: CourseTrackCandidateDTO | undefined): void => {
    const next = new Map(pickKeys())
    if (chart) next.set(number, courseChartKey(chart))
    else next.delete(number)
    saveCoursePickKeys(props.courseId, next)
  }

  /**
   * ランダム枠すべてを無作為に選曲し直す。
   *
   * @returns なし。
   */
  const pickAll = (): void => {
    saveCoursePickKeys(
      props.courseId,
      new Map(
        randomTracks().flatMap((track) => {
          const chart = pickRandomCourseCandidate(track.candidates)
          return chart ? [[track.track_no, courseChartKey(chart)] as const] : []
        })
      )
    )
  }

  /**
   * @param number - トラック番号。
   * @returns 固定譜面、またはランダム枠で選曲済みの譜面。
   */
  const chartOf = (number: number) => {
    const track = trackOf(number)
    return track?.selection_type === 'FIXED' ? track.candidates[0] : picks().get(number)
  }

  return (
    <section aria-label={COPY.heading} class="@container">
      <div class="mb-3 flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold">{COPY.heading}</h2>
        <Show when={!props.loading && !props.error && randomTracks().length > 0}>
          {/* ボタンが見出し行を押し広げないよう上下にはみ出させ、隣の「自分のスコア」と高さを揃える */}
          <div class="-my-1 flex shrink-0 items-center gap-1">
            <Show when={picks().size > 0}>
              <AppTooltipIconButton
                label={COPY.clearAllPicks}
                tone="ghost"
                onClick={() => saveCoursePickKeys(props.courseId, new Map())}
              >
                <RotateCcw size={18} aria-hidden="true" />
              </AppTooltipIconButton>
            </Show>
            <AppButton
              variant="surface"
              size="sm"
              leftIcon={<Dices size={18} aria-hidden="true" />}
              onClick={pickAll}
            >
              {COPY.pickAllRandom}
            </AppButton>
          </div>
        </Show>
      </div>
      <Show
        when={!props.loading}
        fallback={
          <div class="min-h-12">
            <Loading size="inline" />
          </div>
        }
      >
        <Show when={!props.error} fallback={<LoadError error={props.error} />}>
          <Show when={props.scoreError}>
            <p class="mb-2 text-xs text-text-muted">{COPY.bestLoadError}</p>
          </Show>
          <ol class="grid grid-cols-1 gap-3 @4xl:grid-cols-3">
            <For each={COURSE_TRACK_NUMBERS}>
              {(number) => (
                <CourseTrackCard
                  number={number}
                  track={trackOf(number)}
                  records={props.records}
                  picked={picks().get(number)}
                  onPick={(chart) => setPick(number, chart)}
                />
              )}
            </For>
          </ol>
          <Show when={totalBestScore(chartOf, props.records)}>
            {(score) => (
              <div class="mt-3 flex flex-col items-end gap-1">
                <p class="flex items-baseline gap-2">
                  <span class="text-xs text-text-muted">{COPY.total}</span>
                  <span class="font-jost text-lg font-semibold leading-none text-text tabular-nums">
                    {score().toLocaleString('ja-JP')}
                  </span>
                </p>
                <Show when={props.ownCourseScore}>
                  {(ownScore) => (
                    <p
                      class={`font-jost text-sm leading-none tabular-nums ${getScoreDifferenceClass(
                        score() - ownScore()
                      )}`}
                    >
                      <span class="sr-only">{COPY.totalDiffLabel} </span>
                      {formatScoreDifference(score() - ownScore())}
                    </p>
                  )}
                </Show>
              </div>
            )}
          </Show>
        </Show>
      </Show>
    </section>
  )
}

export default CourseTracksSection
