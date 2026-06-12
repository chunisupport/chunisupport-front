import { Button } from '@kobalte/core/button'
import { Checkbox } from '@kobalte/core/checkbox'
import { Select } from '@kobalte/core/select'
import { TextField } from '@kobalte/core/text-field'
import { Check, ChevronDown, Target } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, ErrorBoundary, For, onMount, Show } from 'solid-js'
import { LoadError, Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { sortSongsByReleaseDescAndIdxDesc, useSongsData } from '../../stores/songsData'
import type { SongDTO } from '../../types/api'
import { type BorderCalculatorResult, calculateBorder } from '../../utils/borderCalculator'
import { buildSearchableItems, filterSearchableItems } from '../songs/searchHelpers'

const BORDER_CALCULATOR_COPY = {
  title: 'ボーダー計算機',
  description: '楽曲と譜面を選び、目標スコアまでの許容判定数を計算します。',
  songSearchLabel: '曲名',
  songSearchPlaceholder: '曲名・アーティスト名で検索',
  songCandidatesLabel: '検索候補',
  difficultyLabel: '難易度',
  notesLabel: 'ノーツ数',
  targetScoreLabel: '目標スコア',
  targetJusticeLabel: '目標JUSTICE数',
  fullComboOnlyLabel: 'FULL COMBO指定（MISSを0に固定）',
  submitLabel: '計算する',
  unreachableMessage: '理論値を超えるため到達不能です。',
  noCandidatesMessage: '条件に合う候補はありません。',
  noSongCandidatesMessage: '該当する楽曲はありません。',
  missingChartMessage: '選択した譜面のノーツ数が未登録です。ノーツ数を手入力してください。',
} as const

const DEFAULT_NOTES = '2800'
const DEFAULT_TARGET_SCORE = '1007500'
const SONG_CANDIDATE_LIMIT = 8
const BORDER_CALCULATOR_DIFFICULTIES = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER'] as const
const FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 text-sm text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const COMPACT_FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 font-sans text-sm text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const CHECKBOX_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'
const SONG_CANDIDATE_BUTTON_CLASS =
  'block w-full border-b border-border px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const EMPTY_STATE_CLASS =
  'rounded border border-border bg-surface-muted p-3 text-sm text-text-muted'

type BorderFormFieldProps = {
  id: string
  label: string
  value: string
  required?: boolean
  helpText?: string
  onChange: (value: string) => void
}

type BorderCalculatorDifficulty = (typeof BORDER_CALCULATOR_DIFFICULTIES)[number]

/**
 * 数値文字列をフォーム送信用の整数へ変換する。
 *
 * @param value - 入力欄の文字列。
 * @returns 空欄でなければ数値化した値。
 */
const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : Number(trimmed)
}

/**
 * スコアや判定数を日本語ロケールの桁区切りで表示する。
 *
 * @param value - 表示対象の数値。
 * @returns 桁区切り済みの文字列。
 */
const formatNumber = (value: number): string => value.toLocaleString('ja-JP')

/**
 * ボーダー計算機で選択可能な譜面か判定する。
 *
 * @param value - 判定対象の難易度文字列。
 * @returns BASIC～MASTER の通常譜面であれば true。
 */
const isBorderCalculatorDifficulty = (value: string): value is BorderCalculatorDifficulty =>
  BORDER_CALCULATOR_DIFFICULTIES.some((difficulty) => difficulty === value)

/**
 * 選択中の楽曲と譜面からノーツ数を取得する。
 *
 * @param song - 選択中の楽曲。未選択の場合は null。
 * @param difficulty - 選択中の難易度。
 * @returns 登録済みノーツ数。未登録または譜面なしの場合は null。
 */
const getChartNotes = (
  song: SongDTO | null,
  difficulty: BorderCalculatorDifficulty
): number | null => song?.charts[difficulty]?.notes ?? null

/**
 * ボーダー計算機の数値入力欄を表示する。
 *
 * @param props - 入力欄の識別子、ラベル、値、補足文、変更ハンドラ。
 * @returns Kobalte TextField を使った数値入力欄。
 */
const BorderFormField: Component<BorderFormFieldProps> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block font-medium text-text-muted" for={props.id}>
      {props.label}
      <Show when={props.required}>
        <span class="ml-1 text-danger">*</span>
      </Show>
    </TextField.Label>
    <TextField.Input
      id={props.id}
      name={props.id}
      class={FIELD_INPUT_CLASS}
      inputMode="numeric"
      pattern="[0-9]*"
      required={props.required}
    />
    <Show when={props.helpText}>
      {(helpText) => (
        <p id={`${props.id}-help`} class="mt-1 text-xs text-text-muted">
          {helpText()}
        </p>
      )}
    </Show>
  </TextField>
)

/**
 * ボーダー計算機で利用する譜面選択欄をコンパクトに表示する。
 *
 * @param props - 選択中の難易度と変更ハンドラ。
 * @returns Kobalte Select を使った譜面選択欄。
 */
const DifficultySelectField: Component<{
  value: BorderCalculatorDifficulty
  onChange: (difficulty: BorderCalculatorDifficulty) => void
}> = (props) => (
  <Select<BorderCalculatorDifficulty>
    class="block text-sm"
    options={[...BORDER_CALCULATOR_DIFFICULTIES]}
    value={props.value}
    onChange={(difficulty) => {
      if (difficulty && isBorderCalculatorDifficulty(difficulty)) {
        props.onChange(difficulty)
      }
    }}
    sameWidth
    fitViewport
    itemComponent={(selectProps) => (
      <Select.Item
        item={selectProps.item}
        class="cursor-pointer px-3 py-2 text-text hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg"
      >
        <div class="flex items-center gap-2">
          <Select.ItemIndicator class="inline-flex h-4 w-4 items-center justify-center text-success">
            <Check size={14} />
          </Select.ItemIndicator>
          <Select.ItemLabel>{selectProps.item.rawValue}</Select.ItemLabel>
        </div>
      </Select.Item>
    )}
  >
    <Select.Label class="mb-1 block font-medium text-text-muted">
      {BORDER_CALCULATOR_COPY.difficultyLabel}
    </Select.Label>
    <Select.Trigger class="grid w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring">
      <Select.Value<BorderCalculatorDifficulty> class="truncate">
        {(state) => state.selectedOption()}
      </Select.Value>
      <Select.Icon class="text-text-subtle">
        <ChevronDown size={16} />
      </Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content class="z-50 mt-1 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md">
        <Select.Listbox />
      </Select.Content>
    </Select.Portal>
  </Select>
)

/**
 * ノーツ数入力欄をコンパクトに表示する。
 *
 * @param props - 入力値、補足文、変更ハンドラ。
 * @returns Kobalte TextField を使ったノーツ数入力欄。
 */
const CompactNotesField: Component<{
  value: string
  helpText?: string
  onChange: (value: string) => void
}> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block font-medium text-text-muted" for="notes">
      {BORDER_CALCULATOR_COPY.notesLabel}
    </TextField.Label>
    <TextField.Input
      id="notes"
      name="notes"
      class={`${COMPACT_FIELD_INPUT_CLASS} text-right`}
      inputMode="numeric"
      pattern="[0-9]*"
      required
    />
    <Show when={props.helpText}>
      {(helpText) => (
        <p id="notes-help" class="mt-1 text-xs text-text-muted">
          {helpText()}
        </p>
      )}
    </Show>
  </TextField>
)

/**
 * 楽曲検索入力を選択中の曲名表示欄としても表示する。
 *
 * @param props.query - 検索欄の入力値。
 * @param props.candidates - 検索条件に一致した楽曲候補。
 * @param props.showCandidates - 候補一覧を表示するか。
 * @param props.onQueryChange - 検索欄の変更ハンドラ。
 * @param props.onSelectSong - 候補選択時のハンドラ。
 * @returns 楽曲選択用の検索欄。
 */
const SongSearchField: Component<{
  query: string
  candidates: SongDTO[]
  showCandidates: boolean
  onQueryChange: (query: string) => void
  onSelectSong: (song: SongDTO) => void
}> = (props) => (
  <div class="relative min-w-0">
    <TextField class="block text-sm" value={props.query} onChange={props.onQueryChange}>
      <TextField.Label class="mb-1 block font-medium text-text-muted" for="border-song-search">
        {BORDER_CALCULATOR_COPY.songSearchLabel}
      </TextField.Label>
      <TextField.Input
        id="border-song-search"
        name="border-song-search"
        type="search"
        class={`${COMPACT_FIELD_INPUT_CLASS} truncate`}
        placeholder={BORDER_CALCULATOR_COPY.songSearchPlaceholder}
        autocomplete="off"
      />
    </TextField>

    <Show when={props.showCandidates && props.query.trim() !== ''}>
      <div class="absolute left-0 right-0 top-full z-20 mt-1">
        <Show
          when={props.candidates.length > 0}
          fallback={
            <p class={`${EMPTY_STATE_CLASS} shadow-md`}>
              {BORDER_CALCULATOR_COPY.noSongCandidatesMessage}
            </p>
          }
        >
          <ul
            class="m-0 max-h-72 list-none overflow-y-auto rounded border border-border bg-surface p-0 shadow-md"
            aria-label={BORDER_CALCULATOR_COPY.songCandidatesLabel}
          >
            <For each={props.candidates}>
              {(song) => (
                <li>
                  <Button
                    type="button"
                    class={SONG_CANDIDATE_BUTTON_CLASS}
                    onClick={() => props.onSelectSong(song)}
                  >
                    <span class="min-w-0">
                      <span class="block truncate font-sans font-medium text-text">
                        {song.title}
                      </span>
                      <span class="block truncate font-sans text-xs text-text-muted">
                        {song.artist}
                      </span>
                    </span>
                  </Button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </Show>
  </div>
)

/**
 * ボーダー計算の主要入力を横並びまたは折り返しで表示する。
 *
 * @param props - 楽曲検索、譜面、ノーツ数、送信操作に必要な値とハンドラ。
 * @returns 計算フォームのコンパクトな主操作行。
 */
const BorderCalculatorPrimaryControls: Component<{
  songSearchQuery: string
  songCandidates: SongDTO[]
  showSongCandidates: boolean
  selectedDifficulty: BorderCalculatorDifficulty
  notes: string
  notesHelpText?: string
  onSongSearchQueryChange: (query: string) => void
  onSelectSong: (song: SongDTO) => void
  onDifficultyChange: (difficulty: BorderCalculatorDifficulty) => void
  onNotesChange: (notes: string) => void
}> = (props) => (
  <fieldset class="space-y-3">
    <div class="flex flex-wrap items-start gap-3">
      <div class="min-w-0 basis-full sm:basis-64 md:flex-1">
        <SongSearchField
          query={props.songSearchQuery}
          candidates={props.songCandidates}
          showCandidates={props.showSongCandidates}
          onQueryChange={props.onSongSearchQueryChange}
          onSelectSong={props.onSelectSong}
        />
      </div>
      <div class="w-32 sm:w-36">
        <DifficultySelectField
          value={props.selectedDifficulty}
          onChange={props.onDifficultyChange}
        />
      </div>
      <div class="w-32">
        <CompactNotesField
          value={props.notes}
          helpText={props.notesHelpText}
          onChange={props.onNotesChange}
        />
      </div>
    </div>
  </fieldset>
)

/**
 * ボーダー計算の候補一覧を表示する。
 *
 * @param props.result - MISS数ごとの候補一覧結果。
 * @returns 候補テーブルの JSX 要素。
 */
const CandidateResult: Component<{
  result: Extract<BorderCalculatorResult, { mode: 'candidates'; reachable: true }>
}> = (props) => (
  <Show
    when={props.result.candidates.length > 0}
    fallback={
      <p class="rounded border border-border bg-surface-muted p-4 text-sm text-text-muted">
        {BORDER_CALCULATOR_COPY.noCandidatesMessage}
      </p>
    }
  >
    <div class="w-full overflow-x-auto rounded border border-border sm:max-w-md">
      <table class="w-full table-fixed divide-y divide-border text-center text-sm">
        <thead class="bg-surface-muted text-xs uppercase text-text-muted">
          <tr>
            <th scope="col" class="px-3 py-2">
              JUSTICE
            </th>
            <th scope="col" class="px-3 py-2">
              ATTACK
            </th>
            <th scope="col" class="px-3 py-2">
              MISS
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border bg-surface">
          <For each={props.result.candidates}>
            {(candidate) => (
              <tr>
                <td class="px-3 py-2 font-medium text-text">{formatNumber(candidate.justice)}</td>
                <td class="px-3 py-2 text-text">{formatNumber(candidate.attack)}</td>
                <td class="px-3 py-2 text-text">{formatNumber(candidate.miss)}</td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  </Show>
)

/**
 * CHUNITHMのボーダー計算機ページを表示する。
 *
 * @returns ボーダー計算フォームと結果表示。
 */
const BorderCalculatorPage = (): JSX.Element => {
  const { songsResponse, ensureSongsLoaded, isSongsLoading } = useSongsData()
  const [songSearchQuery, setSongSearchQuery] = createSignal('')
  const [selectedSong, setSelectedSong] = createSignal<SongDTO | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] =
    createSignal<BorderCalculatorDifficulty>('MASTER')
  const [notes, setNotes] = createSignal(DEFAULT_NOTES)
  const [targetScore, setTargetScore] = createSignal(DEFAULT_TARGET_SCORE)
  const [targetJustice, setTargetJustice] = createSignal('')
  const [fullComboOnly, setFullComboOnly] = createSignal(false)
  const [result, setResult] = createSignal<BorderCalculatorResult | null>(null)
  const [errorMessage, setErrorMessage] = createSignal('')

  useDocumentTitle(BORDER_CALCULATOR_COPY.title)

  onMount(() => {
    ensureSongsLoaded()
  })

  const sortedSongs = createMemo(() =>
    sortSongsByReleaseDescAndIdxDesc(songsResponse()?.songs ?? [])
  )

  const searchableSongs = createMemo(() => buildSearchableItems(sortedSongs()))

  const songCandidates = createMemo(() => {
    const query = songSearchQuery().trim()
    if (!query) return []

    return filterSearchableItems(searchableSongs(), query).slice(0, SONG_CANDIDATE_LIMIT)
  })

  const selectedChartNotes = createMemo(() => getChartNotes(selectedSong(), selectedDifficulty()))
  const isSelectedSongDisplayed = createMemo(() => selectedSong()?.title === songSearchQuery())
  const showSongCandidates = createMemo(() => !isSelectedSongDisplayed())

  createEffect(() => {
    const chartNotes = selectedChartNotes()
    if (chartNotes !== null) {
      setNotes(String(chartNotes))
    }
  })

  /**
   * 楽曲候補を選択し、選択中譜面のノーツ数があれば入力欄へ反映する。
   *
   * @param song - 選択した楽曲。
   * @returns なし。
   */
  const handleSelectSong = (song: SongDTO): void => {
    setSelectedSong(song)
    setSongSearchQuery(song.title)
    setResult(null)
    const chartNotes = getChartNotes(song, selectedDifficulty())
    if (chartNotes !== null) {
      setNotes(String(chartNotes))
    }
  }

  /**
   * 楽曲検索欄の入力を更新し、選択中の曲名から変わった場合は選択状態を解除する。
   *
   * @param query - 楽曲検索欄の新しい入力値。
   * @returns なし。
   */
  const handleSongSearchQueryChange = (query: string): void => {
    setSongSearchQuery(query)
    if (selectedSong()?.title !== query) {
      setSelectedSong(null)
      setResult(null)
    }
  }

  /**
   * フォーム入力からボーダー計算を実行する。
   *
   * @param event - フォーム送信イベント。
   * @returns なし。
   */
  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault()
    setErrorMessage('')

    try {
      const calculationResult = calculateBorder({
        notes: Number(notes()),
        targetScore: Number(targetScore()),
        targetJustice: parseOptionalNumber(targetJustice()),
        fullComboOnly: fullComboOnly(),
      })
      setResult(calculationResult)
    } catch (error) {
      setResult(null)
      setErrorMessage(error instanceof Error ? error.message : '入力値を確認してください。')
    }
  }

  return (
    <main class="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Target class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{BORDER_CALCULATOR_COPY.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{BORDER_CALCULATOR_COPY.description}</p>
        </div>
      </header>

      <ErrorBoundary fallback={(err) => <LoadError error={err} />}>
        <Show when={!songsResponse.error} fallback={<LoadError error={songsResponse.error} />}>
          <section class="rounded-lg border border-border bg-surface p-4">
            <Show when={!isSongsLoading()} fallback={<Loading />}>
              <form class="space-y-4" onSubmit={handleSubmit}>
                <BorderCalculatorPrimaryControls
                  songSearchQuery={songSearchQuery()}
                  songCandidates={songCandidates()}
                  showSongCandidates={showSongCandidates()}
                  selectedDifficulty={selectedDifficulty()}
                  notes={notes()}
                  notesHelpText={
                    selectedSong() && selectedChartNotes() === null
                      ? BORDER_CALCULATOR_COPY.missingChartMessage
                      : undefined
                  }
                  onSongSearchQueryChange={handleSongSearchQueryChange}
                  onSelectSong={handleSelectSong}
                  onDifficultyChange={setSelectedDifficulty}
                  onNotesChange={setNotes}
                />

                <fieldset class="space-y-4">
                  <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                    <BorderFormField
                      id="targetScore"
                      label={BORDER_CALCULATOR_COPY.targetScoreLabel}
                      value={targetScore()}
                      required
                      onChange={setTargetScore}
                    />
                    <BorderFormField
                      id="targetJustice"
                      label={BORDER_CALCULATOR_COPY.targetJusticeLabel}
                      value={targetJustice()}
                      onChange={setTargetJustice}
                    />
                    <Button
                      type="submit"
                      class="inline-flex w-fit min-w-24 items-center justify-center rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      {BORDER_CALCULATOR_COPY.submitLabel}
                    </Button>
                  </div>

                  <Checkbox
                    class="relative flex min-h-12 items-center gap-2 text-sm text-text-muted"
                    checked={fullComboOnly()}
                    onChange={setFullComboOnly}
                  >
                    <Checkbox.Input style={{ left: '0', top: '0' }} />
                    <Checkbox.Control class={CHECKBOX_CONTROL_CLASS}>
                      <Checkbox.Indicator>
                        <Check class="h-4 w-4" />
                      </Checkbox.Indicator>
                    </Checkbox.Control>
                    <Checkbox.Label>{BORDER_CALCULATOR_COPY.fullComboOnlyLabel}</Checkbox.Label>
                  </Checkbox>
                </fieldset>

                <Show when={errorMessage()}>
                  {(message) => <p class="text-sm text-danger">{message()}</p>}
                </Show>
              </form>
            </Show>
          </section>

          <Show when={result()}>
            {(currentResult) => (
              <section class="rounded-lg border border-border bg-surface p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 class="text-lg font-semibold">計算結果</h2>
                </div>
                <Show
                  when={currentResult().reachable}
                  fallback={
                    <p class="rounded border border-danger-border bg-danger-bg p-4 text-sm text-danger">
                      {BORDER_CALCULATOR_COPY.unreachableMessage}
                    </p>
                  }
                >
                  <CandidateResult
                    result={
                      currentResult() as Extract<
                        BorderCalculatorResult,
                        { mode: 'candidates'; reachable: true }
                      >
                    }
                  />
                </Show>
              </section>
            )}
          </Show>
        </Show>
      </ErrorBoundary>
    </main>
  )
}

export default BorderCalculatorPage
