import { Button } from '@kobalte/core/button'
import { Collapsible } from '@kobalte/core/collapsible'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronDown, ChevronRight, Dices, RotateCcw, SlidersHorizontal } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  onMount,
  Show,
} from 'solid-js'
import { fetchVersions } from '../../api/songs'
import { fetchMe, fetchUserRating } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { DifficultyBadge } from '../../components/common/DifficultyBadge'
import MultiSelectDropdown from '../../components/common/MultiSelectDropdown'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { sortSongsByReleaseDescAndIdxDesc, useSongsData } from '../../stores/songsData'
import type { PlayerDataDifficulty, PlayerRecordDTO } from '../../types/api'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import {
  buildRandomSongCandidates,
  createRandomSongChartKey,
  createRandomSongRecordMap,
  drawRandomSongs,
  filterRandomSongCandidates,
  filterRandomSongCandidatesByRecord,
  type RandomSongCandidate,
  type RandomSongLampFilter,
  resolveRandomSongRecordLamp,
} from '../../utils/randomSongSelector'
import { getScoreRank } from '../../utils/scoreRank'
import { SCORE_RANK_TEXT_CLASS } from '../users/components/recordStyleClasses'
import {
  RANDOM_SONG_BEST_FRAME_OPTIONS,
  RANDOM_SONG_LAMP_OPTIONS,
  RANDOM_SONG_PLAY_STATUS_OPTIONS,
  RANDOM_SONG_SELECTOR_COPY,
  RANDOM_SONG_SELECTOR_DEFAULT_DIFFICULTIES,
  RANDOM_SONG_SELECTOR_DEFAULTS,
  RANDOM_SONG_SELECTOR_DIFFICULTIES,
} from './randomSongSelector.constants'

const FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 text-sm text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const RESULT_CARD_CLASS =
  'grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center'
const RESULT_RECORD_BADGE_CLASS =
  'inline-flex min-h-7 items-center rounded px-2 py-1 text-xs font-semibold'

const RESULT_RECORD_LAMP_BADGE_CLASS: Record<RandomSongLampFilter, string> = {
  AJC: '[background-image:var(--cs-gradient-lamp-all-justice-critical-bg)] text-white shadow-sm [text-shadow:0_1px_2px_rgb(0_0_0_/_0.65)]',
  AJ: 'bg-lamp-all-justice-bg text-lamp-all-justice-text',
  FC: 'bg-lamp-full-combo-bg text-lamp-full-combo-text',
  CATASTROPHY: 'bg-lamp-catastrophy-bg text-lamp-catastrophy-text',
  ABSOLUTE: 'bg-lamp-absolute-bg text-lamp-absolute-text',
  BRAVE: 'bg-lamp-brave-bg text-lamp-brave-text',
  HARD: 'bg-lamp-hard-bg text-lamp-hard-text',
  CLEAR: 'bg-lamp-clear-bg text-lamp-clear-text',
  FAILED: 'bg-lamp-failed-bg text-lamp-failed-text',
  NONE: 'bg-surface-hover text-text-subtle',
}

type RandomSongTextFieldProps = {
  id: string
  label: string
  value: string
  inputMode?: 'numeric' | 'decimal'
  disabled?: boolean
  onChange: (value: string) => void
}

type RandomSongPlayStatus = (typeof RANDOM_SONG_PLAY_STATUS_OPTIONS)[number]['value']

type RandomSongBestFrame = (typeof RANDOM_SONG_BEST_FRAME_OPTIONS)[number]['value']

type RandomSongLamp = (typeof RANDOM_SONG_LAMP_OPTIONS)[number]['value']

type RandomSongSelectOption<T extends string> = {
  value: T
  label: string
}

type MyRandomSongRecordData = {
  records: PlayerRecordDTO[]
  bestRecords: PlayerRecordDTO[]
}

/**
 * ランダム選曲ツールで使うテキスト入力欄を表示する。
 *
 * @param props - 入力欄の識別子、ラベル、値、入力種別、変更ハンドラ。
 * @returns Kobalte TextField の入力欄。
 */
const RandomSongTextField: Component<RandomSongTextFieldProps> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block font-medium text-text-muted" for={props.id}>
      {props.label}
    </TextField.Label>
    <TextField.Input
      id={props.id}
      name={props.id}
      type="text"
      class={FIELD_INPUT_CLASS}
      inputMode={props.inputMode}
      pattern={
        props.inputMode === 'numeric'
          ? '[0-9]*'
          : props.inputMode === 'decimal'
            ? '[0-9]*[.,]?[0-9]*'
            : undefined
      }
      autocomplete="off"
      disabled={props.disabled}
    />
  </TextField>
)

/**
 * 入力文字列を任意の数値へ変換する。
 *
 * @param value - 入力欄の値。
 * @returns 空欄なら null、それ以外は数値。
 */
const parseOptionalDecimal = (value: string): number | null => {
  const trimmed = value.trim()
  return trimmed === '' ? null : Number(trimmed.replace(',', '.'))
}

/**
 * 入力文字列を選曲数へ変換する。
 *
 * @param value - 曲数入力欄の値。
 * @returns 有効な選曲数。無効値の場合は null。
 */
const parseDrawCount = (value: string): number | null => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return null
  return parsed
}

/**
 * 重み入力値を抽選用の数値へ変換する。
 *
 * @param value - 重み入力欄の値。
 * @returns 有効な重み。無効値の場合は null。
 */
const parseWeightValue = (value: string): number | null => {
  const parsed = Number(value.trim().replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

/**
 * 重み入力Mapを抽選ロジック用の数値Mapへ変換する。
 *
 * @param values - 選択肢ごとの重み入力値。
 * @returns 数値化された重みMap。
 */
const parseWeightValues = <T extends string>(
  values: Record<T, string>
): Partial<Record<T, number>> => {
  const parsedEntries = Object.entries(values).flatMap(([key, value]) => {
    const parsed = parseWeightValue(value)
    return parsed === null ? [] : [[key, parsed]]
  })
  return Object.fromEntries(parsedEntries) as Partial<Record<T, number>>
}

/**
 * 重み入力Mapに無効値が含まれているか判定する。
 *
 * @param values - 選択肢ごとの重み入力値。
 * @returns 無効な重みが含まれている場合は true。
 */
const hasInvalidWeightValue = <T extends string>(values: Record<T, string>): boolean =>
  Object.values(values).some((value) => parseWeightValue(String(value)) === null)

/**
 * ログイン中ユーザーのレコード情報を取得する。
 *
 * @returns 取得できたレコード情報。未ログインや取得失敗時は null。
 */
const fetchMyRandomSongRecordData = async (): Promise<MyRandomSongRecordData | null> => {
  try {
    const me = await fetchMe({ redirectOnUnauthorized: false })
    const [rating, records] = await Promise.all([
      fetchUserRating(me.username),
      fetchUserRecordWithCache(me.username),
    ])

    return {
      records: records.standard,
      bestRecords: rating.best,
    }
  } catch {
    return null
  }
}

/**
 * 配列内の値を選択状態として切り替える。
 *
 * @param values - 現在の選択値。
 * @param value - 切り替える値。
 * @returns 切り替え後の選択値。
 */
const toggleSelectionValue = <T,>(values: readonly T[], value: T): T[] =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

/**
 * レコード表示用に代表ランプのラベルを返す。
 *
 * @param lamp - ランダム選曲で扱う代表ランプ。
 * @returns 画面表示用の短いランプ名。
 */
const formatRandomSongRecordLampLabel = (lamp: RandomSongLampFilter): string =>
  RANDOM_SONG_LAMP_OPTIONS.find((option) => option.value === lamp)?.label ?? lamp

/**
 * ランダム選曲結果で表示するレコードバッジを生成する。
 *
 * @param record - 選曲された譜面に対応する自分のレコード。
 * @returns スコア、ランク、ランプ、OVER POWERの表示。
 */
const renderRandomSongRecordSummary = (record: PlayerRecordDTO | undefined): JSX.Element => {
  if (record?.is_played !== true) {
    return (
      <span class={`${RESULT_RECORD_BADGE_CLASS} ${RESULT_RECORD_LAMP_BADGE_CLASS.NONE}`}>
        未プレイ
      </span>
    )
  }

  const scoreRank = getScoreRank(record.score)
  const lamp = resolveRandomSongRecordLamp(record)

  return (
    <>
      <span class={`${RESULT_RECORD_BADGE_CLASS} bg-surface-muted text-text`}>
        {record.score.toLocaleString('ja-JP')}
        <span class={`ml-1 ${SCORE_RANK_TEXT_CLASS[scoreRank]}`}>{scoreRank}</span>
      </span>
      <span class={`${RESULT_RECORD_BADGE_CLASS} ${RESULT_RECORD_LAMP_BADGE_CLASS[lamp]}`}>
        {formatRandomSongRecordLampLabel(lamp)}
      </span>
      <span class={`${RESULT_RECORD_BADGE_CLASS} bg-surface-muted text-text-muted tabular-nums`}>
        OP {record.overpower.toFixed(2)}
      </span>
    </>
  )
}

/**
 * ランダム選曲ツールで使う単一選択欄を表示する。
 *
 * @param props - 選択肢、選択値、ラベル、変更ハンドラ。
 * @returns Kobalte Select の単一選択欄。
 */
const RandomSongSelect = <T extends string>(props: {
  id: string
  label: string
  value: T
  options: readonly RandomSongSelectOption<T>[]
  disabled?: boolean
  onChange: (value: T) => void
}) => (
  <Select<T>
    class="block text-sm"
    options={props.options.map((option) => option.value)}
    value={props.value}
    onChange={(value) => {
      if (value) props.onChange(value)
    }}
    disabled={props.disabled}
    gutter={0}
    itemComponent={(itemProps) => {
      const label =
        props.options.find((option) => option.value === itemProps.item.rawValue)?.label ??
        itemProps.item.rawValue
      return (
        <Select.Item
          item={itemProps.item}
          class="cursor-pointer px-3 py-2 text-text hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
        >
          <div class="flex items-center gap-2">
            <Select.ItemIndicator class="inline-flex h-4 w-4 items-center justify-center text-success">
              <Check size={14} />
            </Select.ItemIndicator>
            <Select.ItemLabel>{label}</Select.ItemLabel>
          </div>
        </Select.Item>
      )
    }}
  >
    <Select.Label class="mb-1 block font-medium text-text-muted" for={props.id}>
      {props.label}
    </Select.Label>
    <Select.Trigger
      id={props.id}
      class="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Select.Value<T> class="truncate">
        {(state) =>
          props.options.find((option) => option.value === state.selectedOption())?.label ??
          state.selectedOption()
        }
      </Select.Value>
      <Select.Icon class="text-text-subtle">
        <ChevronDown size={16} />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="z-50 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md">
        <Select.Listbox />
      </Select.Content>
    </Select.Portal>
  </Select>
)

/**
 * ランダム選曲ツールページを表示する。
 *
 * @returns 条件フォームとランダム選曲結果。
 */
const RandomSongSelectorPage = (): JSX.Element => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [versionsResponse] = createResource(fetchVersions)
  const [myRecordData] = createResource(fetchMyRandomSongRecordData)
  const [count, setCount] = createSignal(RANDOM_SONG_SELECTOR_DEFAULTS.count)
  const [minConst, setMinConst] = createSignal(RANDOM_SONG_SELECTOR_DEFAULTS.minConst)
  const [maxConst, setMaxConst] = createSignal(RANDOM_SONG_SELECTOR_DEFAULTS.maxConst)
  const [selectedDifficulties, setSelectedDifficulties] = createSignal<PlayerDataDifficulty[]>([
    ...RANDOM_SONG_SELECTOR_DEFAULT_DIFFICULTIES,
  ])
  const [selectedGenres, setSelectedGenres] = createSignal<string[]>([])
  const [selectedVersions, setSelectedVersions] = createSignal<string[]>([])
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = createSignal(false)
  const [playStatus, setPlayStatus] = createSignal<RandomSongPlayStatus>('all')
  const [bestFrame, setBestFrame] = createSignal<RandomSongBestFrame>('all')
  const [selectedLamps, setSelectedLamps] = createSignal<RandomSongLamp[]>(
    RANDOM_SONG_LAMP_OPTIONS.map((option) => option.value)
  )
  const [minScore, setMinScore] = createSignal(RANDOM_SONG_SELECTOR_DEFAULTS.minScore)
  const [maxScore, setMaxScore] = createSignal(RANDOM_SONG_SELECTOR_DEFAULTS.maxScore)
  const [difficultyWeights, setDifficultyWeights] = createSignal<
    Record<PlayerDataDifficulty, string>
  >({
    BASIC: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
    ADVANCED: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
    EXPERT: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
    MASTER: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
    ULTIMA: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
  })
  const [filterInitialized, setFilterInitialized] = createSignal(false)
  const [results, setResults] = createSignal<RandomSongCandidate[]>([])

  useDocumentTitle(RANDOM_SONG_SELECTOR_COPY.title)

  onMount(() => {
    ensureSongsLoaded()
  })

  const sortedSongs = createMemo(() =>
    sortSongsByReleaseDescAndIdxDesc(songsResponse()?.songs ?? [])
  )
  const allCandidates = createMemo(() =>
    buildRandomSongCandidates(sortedSongs(), versionsResponse()?.versions ?? [])
  )
  const genreOptions = createMemo(() =>
    [...new Set(allCandidates().map((candidate) => candidate.genre))].sort((left, right) =>
      left.localeCompare(right, 'ja')
    )
  )
  const versionOptions = createMemo(() => [
    ...new Set(allCandidates().map((candidate) => candidate.version)),
  ])
  const parsedMinConst = createMemo(() => parseOptionalDecimal(minConst()))
  const parsedMaxConst = createMemo(() => parseOptionalDecimal(maxConst()))
  const parsedMinScore = createMemo(() => parseOptionalDecimal(minScore()))
  const parsedMaxScore = createMemo(() => parseOptionalDecimal(maxScore()))
  const parsedCount = createMemo(() => parseDrawCount(count()))
  const recordsByChartKey = createMemo(() =>
    createRandomSongRecordMap(myRecordData()?.records ?? [])
  )
  const bestChartKeys = createMemo(
    () => new Set(createRandomSongRecordMap(myRecordData()?.bestRecords ?? []).keys())
  )
  const hasMyRecordData = createMemo(() => myRecordData() !== null && myRecordData() !== undefined)
  const hasInvalidWeights = createMemo(() => hasInvalidWeightValue(difficultyWeights()))
  const validationMessage = createMemo(() => {
    if (parsedCount() === null) return RANDOM_SONG_SELECTOR_COPY.invalidCountMessage
    const min = parsedMinConst()
    const max = parsedMaxConst()
    const scoreMin = parsedMinScore()
    const scoreMax = parsedMaxScore()
    if (
      (minConst().trim() !== '' && (min === null || Number.isNaN(min))) ||
      (maxConst().trim() !== '' && (max === null || Number.isNaN(max))) ||
      (min !== null && max !== null && min > max)
    ) {
      return RANDOM_SONG_SELECTOR_COPY.invalidConstRangeMessage
    }
    if (
      (minScore().trim() !== '' && (scoreMin === null || Number.isNaN(scoreMin))) ||
      (maxScore().trim() !== '' && (scoreMax === null || Number.isNaN(scoreMax))) ||
      (scoreMin !== null && scoreMax !== null && scoreMin > scoreMax)
    ) {
      return RANDOM_SONG_SELECTOR_COPY.invalidScoreRangeMessage
    }
    if (hasInvalidWeights()) return RANDOM_SONG_SELECTOR_COPY.invalidWeightMessage

    return null
  })
  const filteredCandidates = createMemo(() => {
    const basicFilteredCandidates = filterRandomSongCandidates(allCandidates(), {
      difficulties: selectedDifficulties(),
      genres: selectedGenres(),
      versions: selectedVersions(),
      minConst: parsedMinConst(),
      maxConst: parsedMaxConst(),
    })

    if (!hasMyRecordData()) return basicFilteredCandidates

    return filterRandomSongCandidatesByRecord(
      basicFilteredCandidates,
      recordsByChartKey(),
      bestChartKeys(),
      {
        playStatus: playStatus(),
        bestFrame: bestFrame(),
        minScore: parsedMinScore(),
        maxScore: parsedMaxScore(),
        lamps: selectedLamps(),
      }
    )
  })

  const randomSongWeight = createMemo(() => ({
    difficultyWeights: parseWeightValues(difficultyWeights()),
  }))

  createEffect(() => {
    if (filterInitialized()) return

    const genres = genreOptions()
    const versions = versionOptions()
    if (genres.length === 0 || versions.length === 0) return

    setSelectedGenres(genres)
    setSelectedVersions(versions)
    setFilterInitialized(true)
  })

  /**
   * 現在の条件でランダム選曲を実行する。
   *
   * @returns なし。
   */
  const handleDraw = (): void => {
    const drawCount = parsedCount()
    if (drawCount === null || validationMessage() !== null) return

    setResults(drawRandomSongs(filteredCandidates(), drawCount, randomSongWeight()))
  }

  /**
   * 条件を初期状態へ戻す。
   *
   * @returns なし。
   */
  const handleReset = (): void => {
    setCount(RANDOM_SONG_SELECTOR_DEFAULTS.count)
    setMinConst(RANDOM_SONG_SELECTOR_DEFAULTS.minConst)
    setMaxConst(RANDOM_SONG_SELECTOR_DEFAULTS.maxConst)
    setMinScore(RANDOM_SONG_SELECTOR_DEFAULTS.minScore)
    setMaxScore(RANDOM_SONG_SELECTOR_DEFAULTS.maxScore)
    setPlayStatus('all')
    setBestFrame('all')
    setSelectedLamps(RANDOM_SONG_LAMP_OPTIONS.map((option) => option.value))
    setSelectedDifficulties([...RANDOM_SONG_SELECTOR_DEFAULT_DIFFICULTIES])
    setSelectedGenres(genreOptions())
    setSelectedVersions(versionOptions())
    setDifficultyWeights({
      BASIC: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
      ADVANCED: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
      EXPERT: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
      MASTER: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
      ULTIMA: RANDOM_SONG_SELECTOR_DEFAULTS.defaultWeight,
    })
    setResults([])
  }

  /**
   * 難易度別の重み入力値を更新する。
   *
   * @param difficulty - 更新対象の難易度。
   * @param value - 新しい重み入力値。
   * @returns なし。
   */
  const handleDifficultyWeightChange = (difficulty: PlayerDataDifficulty, value: string): void => {
    setDifficultyWeights((prev) => ({ ...prev, [difficulty]: value }))
  }

  /**
   * 選曲候補に対応する自分のレコードを取得する。
   *
   * @param candidate - 選曲結果の譜面候補。
   * @returns 対応するユーザーレコード。未取得または未存在の場合は undefined。
   */
  const recordForCandidate = (candidate: RandomSongCandidate): PlayerRecordDTO | undefined =>
    recordsByChartKey().get(createRandomSongChartKey(candidate.song.id, candidate.difficulty))

  return (
    <main class="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Dices class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{RANDOM_SONG_SELECTOR_COPY.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{RANDOM_SONG_SELECTOR_COPY.description}</p>
        </div>
      </header>

      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show
          when={!songsResponse.error && !versionsResponse.error}
          fallback={<LoadError error={songsResponse.error ?? versionsResponse.error} />}
        >
          <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
            <Show when={!isSongsLoading() && !versionsResponse.loading} fallback={<Loading />}>
              <form class="space-y-5" onSubmit={(event) => event.preventDefault()}>
                <div class="grid gap-3 sm:max-w-32">
                  <RandomSongTextField
                    id="random-song-count"
                    label={RANDOM_SONG_SELECTOR_COPY.countLabel}
                    value={count()}
                    inputMode="numeric"
                    onChange={setCount}
                  />
                </div>

                <div class="grid gap-3 lg:grid-cols-3">
                  <div>
                    <p class="mb-1 text-sm font-medium text-text-muted">
                      {RANDOM_SONG_SELECTOR_COPY.difficultyLabel}
                    </p>
                    <MultiSelectDropdown
                      options={RANDOM_SONG_SELECTOR_DIFFICULTIES}
                      selected={selectedDifficulties()}
                      placeholder={RANDOM_SONG_SELECTOR_COPY.difficultyLabel}
                      onToggle={(difficulty) =>
                        setSelectedDifficulties((prev) => toggleSelectionValue(prev, difficulty))
                      }
                      onSelectAll={() =>
                        setSelectedDifficulties([...RANDOM_SONG_SELECTOR_DIFFICULTIES])
                      }
                      onClear={() => setSelectedDifficulties([])}
                    />
                  </div>
                  <div>
                    <p class="mb-1 text-sm font-medium text-text-muted">
                      {RANDOM_SONG_SELECTOR_COPY.genreLabel}
                    </p>
                    <MultiSelectDropdown
                      options={genreOptions()}
                      selected={selectedGenres()}
                      placeholder={RANDOM_SONG_SELECTOR_COPY.genreLabel}
                      onToggle={(genre) =>
                        setSelectedGenres((prev) => toggleSelectionValue(prev, genre))
                      }
                      onSelectAll={() => setSelectedGenres(genreOptions())}
                      onClear={() => setSelectedGenres([])}
                    />
                  </div>
                  <div>
                    <p class="mb-1 text-sm font-medium text-text-muted">
                      {RANDOM_SONG_SELECTOR_COPY.versionLabel}
                    </p>
                    <MultiSelectDropdown
                      options={versionOptions()}
                      selected={selectedVersions()}
                      placeholder={RANDOM_SONG_SELECTOR_COPY.versionLabel}
                      onToggle={(version) =>
                        setSelectedVersions((prev) => toggleSelectionValue(prev, version))
                      }
                      onSelectAll={() => setSelectedVersions(versionOptions())}
                      onClear={() => setSelectedVersions([])}
                    />
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-[8rem_8rem_minmax(0,1fr)] sm:items-end">
                  <RandomSongTextField
                    id="random-song-min-const"
                    label={RANDOM_SONG_SELECTOR_COPY.minConstLabel}
                    value={minConst()}
                    inputMode="decimal"
                    onChange={setMinConst}
                  />
                  <RandomSongTextField
                    id="random-song-max-const"
                    label={RANDOM_SONG_SELECTOR_COPY.maxConstLabel}
                    value={maxConst()}
                    inputMode="decimal"
                    onChange={setMaxConst}
                  />
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <p class="text-sm text-text-muted">
                      {RANDOM_SONG_SELECTOR_COPY.candidateCountLabel}:{' '}
                      <span class="font-medium tabular-nums text-text">
                        {filteredCandidates().length.toLocaleString('ja-JP')}
                      </span>
                    </p>
                    <div class="flex gap-2">
                      <Button
                        type="button"
                        class="inline-flex min-h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        onClick={handleReset}
                      >
                        <RotateCcw size={16} aria-hidden="true" />
                        {RANDOM_SONG_SELECTOR_COPY.resetButtonLabel}
                      </Button>
                      <Button
                        type="button"
                        class="inline-flex min-h-10 items-center gap-2 rounded-md bg-action-primary px-4 text-sm font-medium text-text-inverse hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={validationMessage() !== null || filteredCandidates().length === 0}
                        onClick={handleDraw}
                      >
                        <Dices size={16} aria-hidden="true" />
                        {RANDOM_SONG_SELECTOR_COPY.drawButtonLabel}
                      </Button>
                    </div>
                  </div>
                </div>

                <Collapsible
                  open={advancedSettingsOpen()}
                  onOpenChange={setAdvancedSettingsOpen}
                  class="rounded-lg border border-border bg-surface-muted"
                >
                  <Collapsible.Trigger class="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left text-sm font-medium text-text hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring">
                    <span class="inline-flex items-center gap-2">
                      <SlidersHorizontal size={16} aria-hidden="true" />
                      {RANDOM_SONG_SELECTOR_COPY.advancedSettingsLabel}
                    </span>
                    <Show
                      when={advancedSettingsOpen()}
                      fallback={<ChevronRight size={16} aria-hidden="true" />}
                    >
                      <ChevronDown size={16} aria-hidden="true" />
                    </Show>
                  </Collapsible.Trigger>
                  <Collapsible.Content class="border-t border-border p-4">
                    <div class="grid gap-5">
                      <section class="space-y-3">
                        <h3 class="text-sm font-semibold text-text">
                          {RANDOM_SONG_SELECTOR_COPY.recordFilterLabel}
                        </h3>
                        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <RandomSongSelect
                            id="random-song-play-status"
                            label={RANDOM_SONG_SELECTOR_COPY.playStatusLabel}
                            value={playStatus()}
                            options={RANDOM_SONG_PLAY_STATUS_OPTIONS}
                            disabled={!hasMyRecordData()}
                            onChange={setPlayStatus}
                          />
                          <RandomSongSelect
                            id="random-song-best-frame"
                            label={RANDOM_SONG_SELECTOR_COPY.bestFrameLabel}
                            value={bestFrame()}
                            options={RANDOM_SONG_BEST_FRAME_OPTIONS}
                            disabled={!hasMyRecordData()}
                            onChange={setBestFrame}
                          />
                          <div class="sm:col-span-2">
                            <p class="mb-1 text-sm font-medium text-text-muted">
                              {RANDOM_SONG_SELECTOR_COPY.lampLabel}
                            </p>
                            <MultiSelectDropdown
                              options={RANDOM_SONG_LAMP_OPTIONS.map((option) => option.value)}
                              selected={selectedLamps()}
                              placeholder={RANDOM_SONG_SELECTOR_COPY.lampLabel}
                              formatLabel={(value) =>
                                RANDOM_SONG_LAMP_OPTIONS.find((option) => option.value === value)
                                  ?.label ?? value
                              }
                              disabled={!hasMyRecordData()}
                              onToggle={(lamp) =>
                                setSelectedLamps((prev) => toggleSelectionValue(prev, lamp))
                              }
                              onSelectAll={() =>
                                setSelectedLamps(
                                  RANDOM_SONG_LAMP_OPTIONS.map((option) => option.value)
                                )
                              }
                              onClear={() => setSelectedLamps([])}
                            />
                          </div>
                          <RandomSongTextField
                            id="random-song-min-score"
                            label={RANDOM_SONG_SELECTOR_COPY.minScoreLabel}
                            value={minScore()}
                            inputMode="numeric"
                            disabled={!hasMyRecordData()}
                            onChange={setMinScore}
                          />
                          <RandomSongTextField
                            id="random-song-max-score"
                            label={RANDOM_SONG_SELECTOR_COPY.maxScoreLabel}
                            value={maxScore()}
                            inputMode="numeric"
                            disabled={!hasMyRecordData()}
                            onChange={setMaxScore}
                          />
                        </div>
                        <Show when={!hasMyRecordData()}>
                          <p class="text-xs text-text-muted">
                            {RANDOM_SONG_SELECTOR_COPY.recordUnavailableMessage}
                          </p>
                        </Show>
                      </section>

                      <section class="space-y-3">
                        <h3 class="text-sm font-semibold text-text">
                          {RANDOM_SONG_SELECTOR_COPY.difficultyWeightLabel}
                        </h3>
                        <div class="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                          <For each={RANDOM_SONG_SELECTOR_DIFFICULTIES}>
                            {(difficulty) => (
                              <RandomSongTextField
                                id={`random-song-difficulty-weight-${difficulty.toLowerCase()}`}
                                label={difficulty}
                                value={difficultyWeights()[difficulty]}
                                inputMode="decimal"
                                onChange={(value) =>
                                  handleDifficultyWeightChange(difficulty, value)
                                }
                              />
                            )}
                          </For>
                        </div>
                      </section>
                    </div>
                  </Collapsible.Content>
                </Collapsible>

                <Show when={validationMessage()}>
                  {(message) => <p class="text-sm text-danger">{message()}</p>}
                </Show>
              </form>
            </Show>
          </section>

          <section class="rounded-lg border border-border bg-surface-muted p-4 sm:p-6">
            <div class="mb-3 flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">{RANDOM_SONG_SELECTOR_COPY.resultLabel}</h2>
              <span class="text-sm tabular-nums text-text-muted">{results().length}</span>
            </div>
            <Show
              when={results().length > 0}
              fallback={
                <p class="rounded border border-border bg-surface p-4 text-sm text-text-muted">
                  {filteredCandidates().length === 0
                    ? RANDOM_SONG_SELECTOR_COPY.noCandidatesMessage
                    : RANDOM_SONG_SELECTOR_COPY.noResultsMessage}
                </p>
              }
            >
              <div class="grid gap-3">
                <For each={results()}>
                  {(candidate) => {
                    const record = createMemo(() => recordForCandidate(candidate))

                    return (
                      <article class={RESULT_CARD_CLASS}>
                        <div class="min-w-0">
                          <div class="mb-2 flex flex-wrap items-center gap-2">
                            <DifficultyBadge difficulty={candidate.difficulty} compact />
                            <span class="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted">
                              {candidate.levelLabel}
                            </span>
                            <span class="text-xs tabular-nums text-text-muted">
                              {candidate.chartConst.toFixed(1)}
                            </span>
                          </div>
                          <h3 class="truncate font-semibold text-text">{candidate.song.title}</h3>
                          <p class="truncate text-sm text-text-muted">{candidate.song.artist}</p>
                        </div>
                        <div class="flex flex-col gap-2 sm:items-end">
                          <Show when={hasMyRecordData()}>
                            <div class="flex flex-wrap gap-2 sm:justify-end">
                              {renderRandomSongRecordSummary(record())}
                            </div>
                          </Show>
                          <div class="flex flex-wrap gap-2 text-xs text-text-muted sm:justify-end">
                            <span class="rounded bg-surface px-2 py-1">{candidate.genre}</span>
                            <span class="rounded bg-surface px-2 py-1">{candidate.version}</span>
                          </div>
                        </div>
                      </article>
                    )
                  }}
                </For>
              </div>
            </Show>
          </section>
        </Show>
      </ErrorBoundary>
    </main>
  )
}

export default RandomSongSelectorPage
