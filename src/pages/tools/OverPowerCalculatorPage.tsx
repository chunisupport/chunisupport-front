import { Button } from '@kobalte/core/button'
import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { Gauge, Plus } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { fetchVersions } from '../../api/songs'
import { fetchUserLockedSongs } from '../../api/users'
import { LoadError, Loading } from '../../components'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import type { PlayerRecordDTO, SongDTO } from '../../types/api'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { buildCurrentOverPowerBySongId } from '../../usecases/overpower/currentOpTarget'
import { buildOverPowerSummary } from '../../usecases/overpower/overpowerSummary'
import type { OverPowerLockedSong } from '../../usecases/overpower/types'
import {
  calculateOverPowerDifference,
  calculateOverPowerPercent,
  calculatePlayedAverageScore,
  calculateRequiredOverPower,
  calculateUnplayedOverPower,
  formatOverPowerInputValue,
  type OverPowerCalculatorBase,
  parseOverPowerInput,
  type UnplayedOverPowerEntry,
  type UnplayedOverPowerFillMode,
} from '../../utils/overPowerCalculator'
import { formatOverPowerPercent, formatOverPowerValue } from '../users/utils/overPowerFormat'

const OVER_POWER_CALCULATOR_COPY = {
  title: 'OVER POWER計算機',
  description: '理論値・現在値・達成率を相互に計算します。',
  guestMessage: 'ログインして使用すると自動インポートされます。',
  importErrorMessage: 'OVER POWER情報の自動インポートに失敗しました。',
  valueToPercentTitle: '数値→%',
  percentToValueTitle: '%→数値',
  maxLabel: '満点',
  currentLabel: '獲得値',
  addValueLabel: '加算値',
  addButtonLabel: '加算',
  targetPercentLabel: '目標%',
  requiredValueLabel: '必要獲得値',
  differenceLabel: '差分',
  borderTableTitle: 'ボーダー表',
  unplayedCalculatorTitle: '未プレイ除外計算',
  loginRequiredMessage: 'ログイン中のみ使用できます。',
  unplayedModeLabel: '未プレイの扱い',
  manualScoreLabel: '手動指定',
  manualScoreSuffix: '点で埋める',
} as const

const BORDER_PERCENTS = [97.5, 99.0, 99.5] as const
const DEFAULT_MANUAL_FILL_SCORE = '1007500'
const FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 text-right font-mono text-sm tabular-nums text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const RADIO_ITEM_CLASS =
  'relative flex min-h-10 items-center gap-3 rounded-md border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-muted data-[checked]:border-action-primary data-[checked]:bg-action-primary-muted'
const RADIO_CONTROL_CLASS =
  'pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-input-bg data-[checked]:border-action-primary'

const UNPLAYED_FILL_OPTIONS = [
  { value: 'none', label: '何もしない' },
  { value: 'remove', label: '存在を消す' },
  { value: 'theoretical', label: '理論値で埋める' },
  { value: 'playedAverage', label: '全曲の既プレイ平均で埋める' },
  { value: 'manual', label: '手動指定' },
] as const

const ULTIMA_DIFFICULTY = 'ULTIMA'

type OverPowerFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

type OverPowerCalculatorData = OverPowerCalculatorBase & {
  /** 未プレイ除外計算で使う曲ごとの集計情報。 */
  unplayedEntries: UnplayedOverPowerEntry[]
  /** 既プレイ譜面全体の平均スコア。 */
  playedAverageScore: number | null
}

type LockedSongLookup = {
  lockedSongIds: Set<string>
  ultimaLockedSongIds: Set<string>
}

/**
 * OVER POWER計算機の数値入力欄を表示する。
 *
 * @param props - 入力欄の識別子、ラベル、値、変更ハンドラ。
 * @returns Kobalte TextFieldを使った数値入力欄。
 */
const OverPowerField: Component<OverPowerFieldProps> = (props) => (
  <TextField class="block text-sm" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block font-medium text-text-muted" for={props.id}>
      {props.label}
    </TextField.Label>
    <TextField.Input
      id={props.id}
      name={props.id}
      class={FIELD_INPUT_CLASS}
      inputMode="decimal"
      pattern="[0-9]*[.,]?[0-9]*"
    />
  </TextField>
)

/**
 * 数値に符号を付けたOVER POWER表示へ整形する。
 *
 * @param value - 整形する差分値。
 * @returns 正数には+を付けたOVER POWER文字列。
 */
const formatSignedOverPowerValue = (value: number): string => {
  const formatted = formatOverPowerValue(value)
  return value > 0 ? `+${formatted}` : formatted
}

/**
 * 未解禁曲の判定用セットを作成する。
 *
 * @param lockedSongs - ユーザーが未解禁として設定している曲一覧。
 * @returns 通常未解禁とULTIMA未解禁を分けた判定用セット。
 */
const buildLockedSongLookup = (lockedSongs: OverPowerLockedSong[]): LockedSongLookup => {
  const lockedSongIds = new Set<string>()
  const ultimaLockedSongIds = new Set<string>()

  for (const lockedSong of lockedSongs) {
    if (lockedSong.is_ultima) {
      ultimaLockedSongIds.add(lockedSong.display_id)
    } else {
      lockedSongIds.add(lockedSong.display_id)
    }
  }

  return { lockedSongIds, ultimaLockedSongIds }
}

/**
 * 未解禁設定を反映してレコードを残すか判定する。
 *
 * @param record - 判定対象のプレイヤーレコード。
 * @param lockedLookup - 未解禁曲の判定用セット。
 * @returns OVER POWER計算対象ならtrue。
 */
const isRecordAvailable = (record: PlayerRecordDTO, lockedLookup: LockedSongLookup): boolean => {
  if (lockedLookup.lockedSongIds.has(record.id)) return false
  return !(
    record.difficulty === ULTIMA_DIFFICULTY && lockedLookup.ultimaLockedSongIds.has(record.id)
  )
}

/**
 * 未解禁設定を反映した曲の理論OVER POWERと譜面定数を解決する。
 *
 * @param song - 対象曲。
 * @param lockedLookup - 未解禁曲の判定用セット。
 * @returns 理論値と対象譜面定数。譜面定数が取れない場合はnull。
 */
const resolveAvailableSongMax = (
  song: SongDTO,
  lockedLookup: LockedSongLookup
): { max: number; targetConst: number; targetDifficulty: PlayerRecordDTO['difficulty'] } | null => {
  if (!lockedLookup.ultimaLockedSongIds.has(song.id)) {
    const targetDifficulty = song.op_target_difficulty
    const targetConst =
      targetDifficulty === null ? null : (song.charts[targetDifficulty]?.const ?? null)
    if (targetDifficulty !== null && typeof targetConst === 'number') {
      return { max: song.maxop, targetConst, targetDifficulty }
    }
  }

  const chartEntries = Object.entries(song.charts) as [
    PlayerRecordDTO['difficulty'],
    SongDTO['charts'][PlayerRecordDTO['difficulty']],
  ][]
  const availableCharts = chartEntries
    .filter(([difficulty]) => difficulty !== ULTIMA_DIFFICULTY)
    .map(([difficulty, chart]) =>
      typeof chart?.const === 'number' ? { difficulty, chartConst: chart.const } : null
    )
    .filter(
      (chart): chart is { difficulty: PlayerRecordDTO['difficulty']; chartConst: number } =>
        chart !== null
    )
  if (availableCharts.length === 0) return null

  const targetChart = availableCharts.reduce((maxChart, chart) =>
    chart.chartConst > maxChart.chartConst ? chart : maxChart
  )
  return {
    max: (targetChart.chartConst + 3) * 5,
    targetConst: targetChart.chartConst,
    targetDifficulty: targetChart.difficulty,
  }
}

/**
 * 未プレイ除外計算で使う曲ごとの集計情報を作成する。
 *
 * @param songs - 楽曲マスタ一覧。
 * @param records - プレイヤーレコード一覧。
 * @param lockedSongs - 未解禁曲一覧。
 * @returns 曲ごとの現在値、理論値、未プレイ判定。
 */
const buildUnplayedOverPowerEntries = (
  songs: SongDTO[],
  records: PlayerRecordDTO[],
  lockedSongs: OverPowerLockedSong[]
): UnplayedOverPowerEntry[] => {
  const lockedLookup = buildLockedSongLookup(lockedSongs)
  const availableRecords = records.filter((record) => isRecordAvailable(record, lockedLookup))
  const currentBySongId = buildCurrentOverPowerBySongId(availableRecords)
  const recordsBySongId = new Map<string, PlayerRecordDTO[]>()

  for (const record of availableRecords) {
    const songRecords = recordsBySongId.get(record.id) ?? []
    songRecords.push(record)
    recordsBySongId.set(record.id, songRecords)
  }

  return songs
    .filter((song) => !lockedLookup.lockedSongIds.has(song.id))
    .map((song) => {
      const resolvedMax = resolveAvailableSongMax(song, lockedLookup)
      if (!resolvedMax || resolvedMax.max <= 0) return null

      return {
        current: currentBySongId.get(song.id) ?? 0,
        max: resolvedMax.max,
        targetConst: resolvedMax.targetConst,
        isUnplayed: !(recordsBySongId.get(song.id) ?? []).some(
          (record) => record.difficulty === resolvedMax.targetDifficulty && record.is_played
        ),
      }
    })
    .filter((entry): entry is UnplayedOverPowerEntry => entry !== null)
}

/**
 * ログイン中ユーザーのOVER POWER計算基準値を取得する。
 *
 * @param username - ログイン中ユーザー名。
 * @param songs - 楽曲マスタ取得関数。
 * @returns 自動入力に使う理論値と現在値。
 */
const fetchOverPowerCalculatorBase = async (
  username: string,
  songs: NonNullable<ReturnType<typeof useSongsData>['songsResponse']>
): Promise<OverPowerCalculatorData> => {
  const [record, versions, lockedSongs] = await Promise.all([
    fetchUserRecordWithCache(username),
    fetchVersions(),
    fetchUserLockedSongs(username),
  ])
  const songsResponse = songs()
  if (!songsResponse) {
    throw new Error(OVER_POWER_CALCULATOR_COPY.importErrorMessage)
  }

  const summary = buildOverPowerSummary(
    songsResponse.songs,
    record.standard,
    versions.versions,
    lockedSongs.items
  )
  const lockedLookup = buildLockedSongLookup(lockedSongs.items)
  const availableRecords = record.standard.filter((playerRecord) =>
    isRecordAvailable(playerRecord, lockedLookup)
  )

  return {
    max: summary.all.max,
    current: summary.all.current,
    unplayedEntries: buildUnplayedOverPowerEntries(
      songsResponse.songs,
      record.standard,
      lockedSongs.items
    ),
    playedAverageScore: calculatePlayedAverageScore(availableRecords),
  }
}

/**
 * OVER POWER計算機ページを表示する。
 *
 * @returns OVER POWERの数値と達成率を相互変換する計算フォーム。
 */
const OverPowerCalculatorPage = (): JSX.Element => {
  const { songsResponse, ensureSongsLoaded } = useSongsData()
  const [maxValue, setMaxValue] = createSignal('')
  const [currentValue, setCurrentValue] = createSignal('')
  const [addValue, setAddValue] = createSignal('')
  const [targetPercent, setTargetPercent] = createSignal('')
  const [unplayedFillMode, setUnplayedFillMode] = createSignal<UnplayedOverPowerFillMode>('none')
  const [manualFillScore, setManualFillScore] = createSignal(DEFAULT_MANUAL_FILL_SCORE)

  useDocumentTitle(OVER_POWER_CALCULATOR_COPY.title)

  createEffect(() => {
    if (authSession.status === 'authenticated') {
      ensureSongsLoaded()
    }
  })

  const authenticatedUsername = createMemo(() =>
    authSession.status === 'authenticated' ? (authSession.user?.username ?? undefined) : undefined
  )

  const [importedBase] = createResource(
    () => {
      const username = authenticatedUsername()
      return username && songsResponse() ? username : undefined
    },
    (username) => fetchOverPowerCalculatorBase(username, songsResponse)
  )

  createEffect(() => {
    const base = importedBase()
    if (!base) return

    setMaxValue(formatOverPowerInputValue(base.max))
    setCurrentValue(formatOverPowerInputValue(base.current))
    setTargetPercent(formatOverPowerInputValue(calculateOverPowerPercent(base.current, base.max)))
  })

  const parsedMaxValue = createMemo(() => parseOverPowerInput(maxValue()) ?? 0)
  const parsedCurrentValue = createMemo(() => parseOverPowerInput(currentValue()) ?? 0)
  const parsedTargetPercent = createMemo(() => parseOverPowerInput(targetPercent()) ?? 0)
  const importedCurrentValue = createMemo(() => importedBase()?.current ?? parsedCurrentValue())
  const currentPercent = createMemo(() =>
    calculateOverPowerPercent(parsedCurrentValue(), parsedMaxValue())
  )
  const requiredValue = createMemo(() =>
    calculateRequiredOverPower(parsedTargetPercent(), parsedMaxValue())
  )
  const targetDifference = createMemo(() =>
    calculateOverPowerDifference(requiredValue(), importedCurrentValue())
  )
  const borderRows = createMemo(() =>
    BORDER_PERCENTS.map((percent) => {
      const required = calculateRequiredOverPower(percent, parsedMaxValue())
      return {
        percent,
        required,
        difference: calculateOverPowerDifference(required, importedCurrentValue()),
      }
    })
  )
  const unplayedCalculation = createMemo(() =>
    calculateUnplayedOverPower({
      entries: importedBase()?.unplayedEntries ?? [],
      playedAverageScore: importedBase()?.playedAverageScore ?? null,
      mode: unplayedFillMode(),
      manualScore: parseOverPowerInput(manualFillScore()) ?? 0,
    })
  )

  /**
   * 加算値を現在獲得値へ足し、加算入力欄を空に戻す。
   *
   * @returns なし。
   */
  const handleAddValue = (): void => {
    const parsedAddValue = parseOverPowerInput(addValue())
    if (parsedAddValue === null) return

    setCurrentValue(formatOverPowerInputValue(parsedCurrentValue() + parsedAddValue))
    setAddValue('')
  }

  return (
    <main class="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4">
      <Show when={authSession.status !== 'authenticated'}>
        <p class="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
          {OVER_POWER_CALCULATOR_COPY.guestMessage}
        </p>
      </Show>

      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Gauge class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{OVER_POWER_CALCULATOR_COPY.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{OVER_POWER_CALCULATOR_COPY.description}</p>
        </div>
      </header>

      <Show when={importedBase.loading}>
        <Loading />
      </Show>
      <Show when={importedBase.error}>
        <LoadError error={importedBase.error} />
      </Show>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 class="text-lg font-semibold">{OVER_POWER_CALCULATOR_COPY.valueToPercentTitle}</h2>
          <output class="mt-4 block text-4xl font-bold tabular-nums text-action-primary">
            {formatOverPowerPercent(currentPercent())}%
          </output>
          <div class="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <OverPowerField
              id="over-power-current-value"
              label={OVER_POWER_CALCULATOR_COPY.currentLabel}
              value={currentValue()}
              onChange={setCurrentValue}
            />
            <span class="hidden pb-2 text-lg font-semibold text-text-muted sm:block">/</span>
            <OverPowerField
              id="over-power-max-value"
              label={OVER_POWER_CALCULATOR_COPY.maxLabel}
              value={maxValue()}
              onChange={setMaxValue}
            />
          </div>
          <div class="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto]">
            <OverPowerField
              id="over-power-add-value"
              label={OVER_POWER_CALCULATOR_COPY.addValueLabel}
              value={addValue()}
              onChange={setAddValue}
            />
            <Button
              type="button"
              class="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-action-primary px-4 py-2 text-sm font-medium text-text-inverse hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              onClick={handleAddValue}
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
              {OVER_POWER_CALCULATOR_COPY.addButtonLabel}
            </Button>
          </div>
        </section>

        <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 class="text-lg font-semibold">{OVER_POWER_CALCULATOR_COPY.percentToValueTitle}</h2>
          <output class="mt-4 block text-4xl font-bold tabular-nums text-action-primary">
            {formatSignedOverPowerValue(targetDifference())}
          </output>
          <p class="mt-1 text-sm text-text-muted">{OVER_POWER_CALCULATOR_COPY.differenceLabel}</p>
          <div class="mt-5 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <p class="mb-1 text-sm font-medium text-text-muted">
                {OVER_POWER_CALCULATOR_COPY.requiredValueLabel}
              </p>
              <output class="block rounded border border-border bg-surface-muted px-3 py-2 text-right font-mono text-sm tabular-nums text-text">
                {formatOverPowerValue(requiredValue())}
              </output>
            </div>
            <span class="hidden pb-2 text-lg font-semibold text-text-muted sm:block">/</span>
            <OverPowerField
              id="over-power-max-value-percent"
              label={OVER_POWER_CALCULATOR_COPY.maxLabel}
              value={maxValue()}
              onChange={setMaxValue}
            />
          </div>
          <div class="mt-4">
            <OverPowerField
              id="over-power-target-percent"
              label={OVER_POWER_CALCULATOR_COPY.targetPercentLabel}
              value={targetPercent()}
              onChange={setTargetPercent}
            />
          </div>
        </section>
      </div>

      <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <h2 class="text-lg font-semibold">{OVER_POWER_CALCULATOR_COPY.borderTableTitle}</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="border-b border-border text-left text-text-muted">
              <tr>
                <th class="whitespace-nowrap px-3 py-2 font-medium">
                  {OVER_POWER_CALCULATOR_COPY.targetPercentLabel}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-right font-medium">
                  {OVER_POWER_CALCULATOR_COPY.requiredValueLabel}
                </th>
                <th class="whitespace-nowrap px-3 py-2 text-right font-medium">
                  {OVER_POWER_CALCULATOR_COPY.differenceLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              <For each={borderRows()}>
                {(row) => (
                  <tr class="border-b border-border last:border-b-0">
                    <td class="whitespace-nowrap px-3 py-2 tabular-nums">
                      {formatOverPowerPercent(row.percent, 1)}%
                    </td>
                    <td class="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatOverPowerValue(row.required)}
                    </td>
                    <td class="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatSignedOverPowerValue(row.difference)}
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </section>

      <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <h2 class="text-lg font-semibold">{OVER_POWER_CALCULATOR_COPY.unplayedCalculatorTitle}</h2>
        <Show
          when={authSession.status === 'authenticated'}
          fallback={
            <p class="mt-4 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
              {OVER_POWER_CALCULATOR_COPY.loginRequiredMessage}
            </p>
          }
        >
          <output class="mt-4 block text-4xl font-bold tabular-nums text-action-primary">
            {formatOverPowerPercent(unplayedCalculation().percent)}%
          </output>
          <p class="mt-2 font-mono text-sm tabular-nums text-text-muted">
            {formatOverPowerValue(unplayedCalculation().current)} /{' '}
            {formatOverPowerValue(unplayedCalculation().max)}
          </p>

          <RadioGroup
            name="unplayed-over-power-mode"
            value={unplayedFillMode()}
            onChange={(value) => setUnplayedFillMode(value as UnplayedOverPowerFillMode)}
            class="mt-5 space-y-2"
          >
            <RadioGroup.Label class="block text-sm font-medium text-text-muted">
              {OVER_POWER_CALCULATOR_COPY.unplayedModeLabel}
            </RadioGroup.Label>
            <For each={UNPLAYED_FILL_OPTIONS}>
              {(option) => (
                <RadioGroup.Item value={option.value} class={RADIO_ITEM_CLASS}>
                  <RadioGroup.ItemInput class="peer" />
                  <RadioGroup.ItemControl class={RADIO_CONTROL_CLASS}>
                    <RadioGroup.ItemIndicator class="h-2.5 w-2.5 rounded-full bg-action-primary" />
                  </RadioGroup.ItemControl>
                  <RadioGroup.ItemLabel class="min-w-0 flex-1 cursor-pointer">
                    <Show when={option.value === 'manual'} fallback={<span>{option.label}</span>}>
                      <span class="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span class="shrink-0">{OVER_POWER_CALCULATOR_COPY.manualScoreLabel}</span>
                        <TextField
                          class="w-full sm:w-40"
                          value={manualFillScore()}
                          onChange={setManualFillScore}
                        >
                          <TextField.Input
                            id="unplayed-over-power-manual-score"
                            name="unplayed-over-power-manual-score"
                            aria-label={OVER_POWER_CALCULATOR_COPY.manualScoreLabel}
                            class={FIELD_INPUT_CLASS}
                            inputMode="numeric"
                            pattern="[0-9]*"
                          />
                        </TextField>
                        <span class="shrink-0 text-text-muted">
                          {OVER_POWER_CALCULATOR_COPY.manualScoreSuffix}
                        </span>
                      </span>
                    </Show>
                  </RadioGroup.ItemLabel>
                </RadioGroup.Item>
              )}
            </For>
          </RadioGroup>
        </Show>
      </section>
    </main>
  )
}

export default OverPowerCalculatorPage
