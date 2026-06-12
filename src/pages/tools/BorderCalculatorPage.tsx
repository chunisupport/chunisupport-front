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
import { DIFFICULTY_SHORT_NAME_MAP, difficultyBadgeClass } from '../../utils/difficultyUtils'
import { buildSearchableItems, filterSearchableItems } from '../songs/searchHelpers'

const BORDER_CALCULATOR_COPY = {
  title: 'ボーダー計算機',
  description: '楽曲と譜面からノーツ数を反映し、目標スコア達成に許容される判定数を計算します。',
  songSearchLabel: '楽曲検索',
  songSearchPlaceholder: '曲名・アーティスト名で検索',
  songCandidatesLabel: '候補楽曲',
  selectedSongLabel: '選択中の楽曲',
  difficultyLabel: '譜面',
  notesLabel: 'ノーツ数',
  targetScoreLabel: '目標スコア',
  targetJusticeLabel: '目標JUSTICE数',
  fullComboOnlyLabel: 'FULL COMBO指定（MISSを0に固定）',
  submitLabel: '計算する',
  unreachableMessage: '理論値を超えるため到達不能です。',
  noCandidatesMessage: '条件に合う候補はありません。',
  noSongCandidatesMessage: '該当する楽曲はありません。',
  noSelectedSongMessage: '楽曲未選択',
  missingChartMessage: '選択した譜面のノーツ数が未登録です。ノーツ数を手入力してください。',
} as const

const DEFAULT_NOTES = '2800'
const DEFAULT_TARGET_SCORE = '1007500'
const SONG_CANDIDATE_LIMIT = 8
const BORDER_CALCULATOR_DIFFICULTIES = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER'] as const
const FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 text-sm text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const CHECKBOX_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'
const SONG_CANDIDATE_BUTTON_CLASS =
  'flex w-full items-center justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

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
 * ボーダー計算機で利用する譜面選択欄を表示する。
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
    setResult(null)
    const chartNotes = getChartNotes(song, selectedDifficulty())
    if (chartNotes !== null) {
      setNotes(String(chartNotes))
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
                <div class="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div class="space-y-3">
                    <TextField
                      class="block text-sm"
                      value={songSearchQuery()}
                      onChange={setSongSearchQuery}
                    >
                      <TextField.Label
                        class="mb-1 block font-medium text-text-muted"
                        for="border-song-search"
                      >
                        {BORDER_CALCULATOR_COPY.songSearchLabel}
                      </TextField.Label>
                      <TextField.Input
                        id="border-song-search"
                        name="border-song-search"
                        type="search"
                        class={FIELD_INPUT_CLASS}
                        placeholder={BORDER_CALCULATOR_COPY.songSearchPlaceholder}
                      />
                    </TextField>

                    <div>
                      <p class="mb-1 text-sm font-medium text-text-muted">
                        {BORDER_CALCULATOR_COPY.songCandidatesLabel}
                      </p>
                      <Show
                        when={songSearchQuery().trim() === '' || songCandidates().length > 0}
                        fallback={
                          <p class="rounded border border-border bg-surface-muted p-3 text-sm text-text-muted">
                            {BORDER_CALCULATOR_COPY.noSongCandidatesMessage}
                          </p>
                        }
                      >
                        <Show
                          when={songCandidates().length > 0}
                          fallback={
                            <p class="rounded border border-border bg-surface-muted p-3 text-sm text-text-muted">
                              {BORDER_CALCULATOR_COPY.songSearchPlaceholder}
                            </p>
                          }
                        >
                          <div class="max-h-72 overflow-y-auto rounded border border-border bg-surface">
                            <For each={songCandidates()}>
                              {(song) => (
                                <Button
                                  type="button"
                                  class={SONG_CANDIDATE_BUTTON_CLASS}
                                  onClick={() => handleSelectSong(song)}
                                >
                                  <span class="min-w-0">
                                    <span class="block truncate font-medium text-text">
                                      {song.title}
                                    </span>
                                    <span class="block truncate text-xs text-text-muted">
                                      {song.artist}
                                    </span>
                                  </span>
                                  <span class="shrink-0 text-xs text-text-subtle">
                                    {song.official_idx ?? song.id}
                                  </span>
                                </Button>
                              )}
                            </For>
                          </div>
                        </Show>
                      </Show>
                    </div>
                  </div>

                  <div class="space-y-4">
                    <div class="rounded border border-border bg-surface-muted p-3 text-sm">
                      <p class="text-xs font-medium text-text-muted">
                        {BORDER_CALCULATOR_COPY.selectedSongLabel}
                      </p>
                      <Show
                        when={selectedSong()}
                        fallback={
                          <p class="mt-1 text-text-muted">
                            {BORDER_CALCULATOR_COPY.noSelectedSongMessage}
                          </p>
                        }
                      >
                        {(song) => (
                          <div class="mt-2 flex min-w-0 items-start justify-between gap-3">
                            <div class="min-w-0">
                              <p class="truncate font-medium text-text">{song().title}</p>
                              <p class="truncate text-xs text-text-muted">{song().artist}</p>
                            </div>
                            <span
                              class={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${difficultyBadgeClass(
                                selectedDifficulty()
                              )}`}
                            >
                              {DIFFICULTY_SHORT_NAME_MAP[selectedDifficulty()]}
                            </span>
                          </div>
                        )}
                      </Show>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                      <DifficultySelectField
                        value={selectedDifficulty()}
                        onChange={setSelectedDifficulty}
                      />
                      <BorderFormField
                        id="notes"
                        label={BORDER_CALCULATOR_COPY.notesLabel}
                        value={notes()}
                        required
                        helpText={
                          selectedSong() && selectedChartNotes() === null
                            ? BORDER_CALCULATOR_COPY.missingChartMessage
                            : undefined
                        }
                        onChange={setNotes}
                      />
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
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
                  </div>
                </div>

                <Show when={errorMessage()}>
                  {(message) => <p class="text-sm text-danger">{message()}</p>}
                </Show>

                <Button
                  type="submit"
                  class="inline-flex min-h-12 items-center justify-center rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  {BORDER_CALCULATOR_COPY.submitLabel}
                </Button>
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
