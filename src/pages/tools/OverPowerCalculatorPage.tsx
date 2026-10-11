import { NumberField } from '@kobalte/core/number-field'
import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { CornerLeftUp, LockKeyhole, Percent, Plus, Slash } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createEffect, createMemo, createResource, createSignal, For, Show } from 'solid-js'
import { fetchGenres } from '../../api/genres'
import { fetchNameFolders } from '../../api/nameFolders'
import { fetchVersions } from '../../api/songs'
import {
  fetchUserLockedSongs,
  fetchUserProfileSummary,
  updateMyLockedSongsBatch,
} from '../../api/users'
import { LoadError, Loading } from '../../components'
import { AppButton, AppIconButton } from '../../components/common/AppButton'
import { AppTabContent, UnderlineTabs } from '../../components/common/AppTabs'
import { CheckboxField } from '../../components/common/CheckboxField'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_THEORETICAL_MAX } from '../../constants/chart'
import { getPossessionClassName } from '../../constants/possession'
import { OVER_POWER_CALCULATOR_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { createOverPowerCalculatorInputs } from '../../hooks/createOverPowerCalculatorInputs'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import type { PlayerLockedSongRequest } from '../../types/api'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { buildOverPowerCalculatorData } from '../../usecases/overpower/calculator'
import {
  buildLockedSongsBatchPayload,
  createLockedSongKey,
} from '../../usecases/overpower/lockedSongsBatch'
import {
  calculateOverPowerDifference,
  calculateOverPowerPercent,
  calculateRequiredChartCount,
  calculateRequiredOverPower,
  calculateUnplayedOverPower,
  formatOverPowerInputValue,
  normalizeOverPowerCalculatorInput,
  parseOverPowerInput,
  type UnplayedOverPowerFillMode,
} from '../../utils/overPowerCalculator'
import {
  CALCULATOR_PERCENT_DECIMALS,
  CALCULATOR_PERCENT_MAX,
  CALCULATOR_VALUE_DECIMALS,
  REQUIRED_CHART_LAMP_COLUMNS,
} from '../../utils/overPowerCalculatorConstants'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import LockedSongsDialog from '../users/UserOverPower/components/LockedSongsDialog'
import {
  DEFAULT_MANUAL_FILL_SCORE,
  DEFAULT_REQUIRED_CHART_CONSTANT,
  DEFAULT_REQUIRED_CURRENT_SCORE,
  DEFAULT_REQUIRED_TARGET_SCORE,
  OVER_POWER_CALCULATOR_COPY,
  OVER_POWER_CALCULATOR_TABS,
  QUICK_TARGET_PERCENTS,
  UNPLAYED_FILL_OPTIONS,
} from './overPowerCalculator.constants'

/** 数値入力欄の表示・制約・変更通知。 */
type OverPowerFieldProps = {
  id: string
  label: string
  value: string
  min?: number
  max?: number
  step?: number
  decimalPlaces?: number
  fullWidth?: boolean
  inputMode?: 'numeric' | 'decimal'
  onChange: (value: string) => void
}

/** 数値入力のスタイル。360pxでも左右の入力欄を並べられる幅に収める。 */
const INPUT_CLASS =
  'h-12 min-w-0 w-full rounded-md border border-border-strong bg-input-bg px-2 text-right font-sans text-base tabular-nums text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * 固定小数表示と範囲制限を持つ計算機専用の数値入力欄を描画する。
 *
 * @param props - 入力欄ID、ラベル、値、制約、小数桁数、更新通知先。
 * @returns 固定小数の編集位置を保ち、範囲制限をKobalteで扱うNumberField。
 */
const OverPowerField: Component<OverPowerFieldProps> = (props) => {
  const decimalPlaces = () => props.decimalPlaces ?? CALCULATOR_VALUE_DECIMALS
  /**
   * 入力値を制限範囲と常時表示する小数桁数へ合わせる。
   * @param value - NumberFieldから受け取った入力文字列。
   * @returns なし。
   */
  const handleChange = (value: string): void =>
    props.onChange(normalizeOverPowerCalculatorInput(value, decimalPlaces(), props.min, props.max))
  /**
   * 小数点の入力時に編集領域を選択し、固定表示のまま数値を編集する。
   * @param event - 入力前イベント。モバイルの小数点入力にも対応する。
   * @returns なし。
   */
  const handleBeforeInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    const input = event.currentTarget
    if (event.data === '.' || event.data === ',') {
      if (input.selectionStart === 0 && input.selectionEnd === input.value.length) {
        event.preventDefault()
        props.onChange(formatOverPowerInputValue(Math.max(props.min ?? 0, 0), decimalPlaces()))
        input.setSelectionRange(input.value.indexOf('.') + 1, input.value.length)
        return
      }
      if (input.selectionStart !== input.selectionEnd || !input.value.includes('.')) return
      event.preventDefault()
      input.setSelectionRange(input.value.indexOf('.') + 1, input.value.length)
    }
  }
  /**
   * 固定小数への再整形後も入力中のカーソル位置を保つ。
   * @param event - NumberFieldの数値処理前に通知される入力イベント。
   * @returns なし。
   */
  const handleInput: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    const input = event.currentTarget
    const start = input.selectionStart
    const end = input.selectionEnd
    queueMicrotask(() => input.setSelectionRange(start, end))
  }
  return (
    <NumberField
      id={props.id}
      name={props.id}
      value={props.value}
      onChange={handleChange}
      minValue={props.min ?? 0}
      maxValue={props.max}
      step={props.step ?? 10 ** -decimalPlaces()}
      formatOptions={{
        useGrouping: false,
        minimumFractionDigits: decimalPlaces(),
        maximumFractionDigits: decimalPlaces(),
      }}
      class={`min-w-0 flex-1 ${props.fullWidth ? '' : 'max-w-40'}`}
    >
      <NumberField.Label class="mb-1 block text-sm font-medium text-text-muted">
        {props.label}
      </NumberField.Label>
      <NumberField.Input
        class={INPUT_CLASS}
        inputMode={props.inputMode ?? 'decimal'}
        onFocus={(event: FocusEvent & { currentTarget: HTMLInputElement }) =>
          event.currentTarget.select()
        }
        onBeforeInput={handleBeforeInput}
        onInput={handleInput}
      />
    </NumberField>
  )
}

/**
 * 数値入力・出力を大きなスラッシュで区切って横並びにする。
 * @param props - 左右に表示する入力欄または出力欄と読み上げラベル。
 * @returns モバイル幅に収まる比率表示。
 */
const OverPowerRatio: Component<{ left: JSX.Element; right: JSX.Element; label: string }> = (
  props
) => (
  <fieldset
    class="flex min-w-0 max-w-sm items-end gap-2 [&>div]:max-w-none"
    aria-label={props.label}
  >
    {props.left}
    <Slash class="mb-3 h-6 w-6 shrink-0 text-text-subtle" aria-hidden="true" />
    {props.right}
  </fieldset>
)

/**
 * OVER POWER計算機ページを表示する。
 *
 * @returns OVER POWERの数値と達成率を相互変換する計算フォーム。
 */
const OverPowerCalculatorPage = (): JSX.Element => {
  const { songsResponse, ensureSongsLoaded } = useSongsData()
  const [addValue, setAddValue] = createSignal('')
  const [unlockLockedSongs, setUnlockLockedSongs] = createSignal(false)
  const [unplayedFillMode, setUnplayedFillMode] = createSignal<UnplayedOverPowerFillMode>('none')
  const [manualFillScore, setManualFillScore] = createSignal(
    formatOverPowerInputValue(Number(DEFAULT_MANUAL_FILL_SCORE))
  )
  const [chartConstant, setChartConstant] = createSignal(
    formatOverPowerInputValue(Number(DEFAULT_REQUIRED_CHART_CONSTANT), 1)
  )
  const [currentChartScore, setCurrentChartScore] = createSignal(DEFAULT_REQUIRED_CURRENT_SCORE)
  const [targetChartScore, setTargetChartScore] = createSignal(DEFAULT_REQUIRED_TARGET_SCORE)
  const [selectedTab, setSelectedTab] =
    createSignal<(typeof OVER_POWER_CALCULATOR_TABS)[number]['value']>('value')
  const [lockedSongsDialogOpen, setLockedSongsDialogOpen] = createSignal(false)

  const tool = getToolLink(OVER_POWER_CALCULATOR_PATH)
  useDocumentTitle(tool.title)

  createEffect(() => {
    if (authSession.status === 'authenticated') {
      ensureSongsLoaded()
    }
  })

  const authenticatedUsername = createMemo(() =>
    authSession.status === 'authenticated' ? (authSession.user?.username ?? undefined) : undefined
  )

  const [importedData, { refetch: refetchImportedBase }] = createResource(
    authenticatedUsername,
    async (username) => {
      const [record, versions, lockedSongs, genres, nameFolders, profile] = await Promise.all([
        fetchUserRecordWithCache(username),
        fetchVersions(),
        fetchUserLockedSongs(username),
        fetchGenres(),
        fetchNameFolders(),
        fetchUserProfileSummary(username),
      ])
      return {
        username,
        record,
        versions: versions.versions,
        lockedSongs: lockedSongs.items,
        genres,
        nameFolders,
        player: profile.player,
      }
    }
  )
  const currentData = createMemo(() => {
    const data = importedData.error ? undefined : importedData()
    return data?.username === authenticatedUsername() ? data : undefined
  })
  const importedBase = createMemo(() => {
    const data = currentData()
    const songs = songsResponse.error ? undefined : songsResponse()
    if (!data || !songs) return undefined
    return buildOverPowerCalculatorData(
      songs.songs,
      data.record.standard,
      data.versions,
      unlockLockedSongs() ? [] : data.lockedSongs
    )
  })
  const importLoading = createMemo(() => importedData.loading || songsResponse.loading)
  const importError = createMemo(() => importedData.error ?? songsResponse.error)

  const lockedSongsSelectionKey = createMemo(() =>
    JSON.stringify(
      (unlockLockedSongs() ? [] : (currentData()?.lockedSongs ?? []))
        .map((song) => createLockedSongKey(song.id, song.is_ultima))
        .sort()
    )
  )
  const { maxValue, setMaxValue, currentValue, setCurrentValue, targetPercent, setTargetPercent } =
    createOverPowerCalculatorInputs(authenticatedUsername, importedBase, lockedSongsSelectionKey)

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
  const requiredChartCounts = createMemo(() =>
    REQUIRED_CHART_LAMP_COLUMNS.map((lamp) => ({
      ...lamp,
      count: calculateRequiredChartCount(
        targetDifference(),
        parseOverPowerInput(targetChartScore()) ?? 0,
        parseOverPowerInput(chartConstant()) ?? CHART_CONST_MIN,
        lamp.value,
        parseOverPowerInput(currentChartScore()) ?? 0
      ),
    }))
  )
  const unplayedCalculation = createMemo(() =>
    calculateUnplayedOverPower({
      entries: importedBase()?.unplayedEntries ?? [],
      playedAverageScore: importedBase()?.playedAverageScore ?? null,
      playedAverageScoreByConst: importedBase()?.playedAverageScoreByConst ?? new Map(),
      playedAverageScoreRegression: importedBase()?.playedAverageScoreRegression ?? null,
      mode: unplayedFillMode(),
      manualScore: parseOverPowerInput(manualFillScore()) ?? 0,
    })
  )
  const unplayedSongCount = createMemo(
    () => importedBase()?.unplayedEntries.filter((entry) => entry.isUnplayed).length ?? 0
  )
  const playedAverageScoreLabel = createMemo(() => {
    const score = importedBase()?.playedAverageScore
    return score === null || typeof score === 'undefined'
      ? OVER_POWER_CALCULATOR_COPY.noPlayedAverageLabel
      : `${formatOverPowerInputValue(score)}${OVER_POWER_CALCULATOR_COPY.manualScoreSuffix}`
  })
  const lockedSongsButtonDisabled = createMemo(() => importLoading() || !importedBase())

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

  /**
   * 未解禁楽曲設定の差分を保存し、計算用データを再取得する。
   *
   * @param nextLockedSongs - ダイアログで編集された未解禁楽曲設定一覧。
   * @returns 保存処理の完了Promise。
   */
  const handleSaveLockedSongs = async (
    nextLockedSongs: PlayerLockedSongRequest[]
  ): Promise<void> => {
    const currentLockedSongs = currentData()?.lockedSongs
    if (!currentLockedSongs) return

    const payload = buildLockedSongsBatchPayload(currentLockedSongs, nextLockedSongs)
    if (!payload.add && !payload.delete) return

    await updateMyLockedSongsBatch(payload)
    await refetchImportedBase()
  }

  return (
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <Show when={authSession.status !== 'authenticated'}>
        <p class="rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
          {OVER_POWER_CALCULATOR_COPY.guestMessage}
        </p>
      </Show>

      <header>
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
              <Percent class="h-5 w-5 text-action-primary" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h1 class="text-xl font-semibold sm:text-2xl">{tool.title}</h1>
              <p class="mt-1 font-sans text-sm text-text-muted">{tool.description}</p>
            </div>
          </div>
          <Show when={authSession.status === 'authenticated'}>
            <AppIconButton
              size="md"
              tone="surface"
              class="shrink-0"
              aria-label={OVER_POWER_CALCULATOR_COPY.lockedSongsSettingsLabel}
              title={OVER_POWER_CALCULATOR_COPY.lockedSongsSettingsLabel}
              disabled={lockedSongsButtonDisabled()}
              onClick={() => setLockedSongsDialogOpen(true)}
            >
              <LockKeyhole class="h-5 w-5" aria-hidden="true" />
            </AppIconButton>
          </Show>
        </div>
        <Show when={authSession.status === 'authenticated'}>
          <CheckboxField
            class="mt-4"
            checked={unlockLockedSongs()}
            onChange={setUnlockLockedSongs}
            label={OVER_POWER_CALCULATOR_COPY.unlockLockedSongsLabel}
          />
        </Show>
      </header>
      <Show when={importLoading() && authenticatedUsername()}>
        <Loading />
      </Show>
      <Show when={importError() && authenticatedUsername()}>
        <LoadError error={importError()} />
      </Show>

      <Show when={currentData() && importedBase() && currentData()}>
        {(data) => (
          <LockedSongsDialog
            open={lockedSongsDialogOpen()}
            songs={songsResponse()?.songs ?? []}
            records={data().record.standard}
            genres={data().genres}
            versions={data().versions}
            nameFolders={data().nameFolders}
            officialOverPower={data().player?.official_overpower ?? 0}
            officialOverPowerPercent={data().player?.official_overpower_percent ?? null}
            lockedSongs={data().lockedSongs}
            onOpenChange={setLockedSongsDialogOpen}
            onSaveLockedSongs={handleSaveLockedSongs}
          />
        )}
      </Show>

      <UnderlineTabs
        options={OVER_POWER_CALCULATOR_TABS}
        value={selectedTab()}
        onChange={setSelectedTab}
        listClass="gap-0 sm:gap-2"
        triggerClass="whitespace-nowrap !px-2 !text-sm sm:!px-3 data-selected:!bg-transparent"
      >
        <AppTabContent
          value="value"
          class="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-6"
        >
          <p class="mb-1 text-sm text-text-muted">{OVER_POWER_CALCULATOR_COPY.resultLabel}</p>
          <output
            aria-live="polite"
            class="block font-jost text-4xl font-bold tabular-nums text-action-primary"
          >
            {formatOverPowerPercent(currentPercent())}%
          </output>
          <div class="mt-5">
            <OverPowerRatio
              label={OVER_POWER_CALCULATOR_COPY.ratioLabel}
              left={
                <OverPowerField
                  id="over-power-current-value"
                  label={OVER_POWER_CALCULATOR_COPY.currentLabel}
                  value={currentValue()}
                  onChange={setCurrentValue}
                />
              }
              right={
                <OverPowerField
                  id="over-power-max-value"
                  label={OVER_POWER_CALCULATOR_COPY.maxLabel}
                  value={maxValue()}
                  onChange={setMaxValue}
                />
              }
            />
          </div>
          <form
            class="mt-2 flex max-w-sm items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              handleAddValue()
            }}
          >
            <CornerLeftUp class="h-6 w-6 shrink-0 text-text-subtle" aria-hidden="true" />
            <div class="flex min-w-0 flex-1">
              <TextField value={addValue()} onChange={setAddValue} class="min-w-0 flex-1">
                <TextField.Label class="sr-only">
                  {OVER_POWER_CALCULATOR_COPY.addValueLabel}
                </TextField.Label>
                <TextField.Input
                  id="over-power-add-value"
                  inputMode="decimal"
                  class={`${INPUT_CLASS} !rounded-r-none !border-r-0`}
                />
              </TextField>
              <AppButton
                type="submit"
                variant="primary"
                class="min-h-12 shrink-0 !rounded-l-none"
                leftIcon={<Plus class="h-4 w-4" aria-hidden="true" />}
              >
                {OVER_POWER_CALCULATOR_COPY.addButtonLabel}
              </AppButton>
            </div>
          </form>
        </AppTabContent>

        <AppTabContent
          value="percent"
          class="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-6"
        >
          <OverPowerRatio
            label={OVER_POWER_CALCULATOR_COPY.requiredRatioLabel}
            left={
              <div class="min-w-0 flex-1">
                <p class="mb-1 text-sm font-medium text-text-muted">
                  {OVER_POWER_CALCULATOR_COPY.resultLabel}
                </p>
                <output
                  aria-live="polite"
                  class="flex h-12 items-center justify-end font-jost text-2xl sm:text-3xl font-bold tabular-nums text-action-primary"
                >
                  {formatOverPowerValue(requiredValue())}
                </output>
              </div>
            }
            right={
              <OverPowerField
                id="over-power-max-value-percent"
                label={OVER_POWER_CALCULATOR_COPY.maxLabel}
                value={maxValue()}
                onChange={setMaxValue}
              />
            }
          />
          <p class="mt-1 text-sm text-text-muted">
            {OVER_POWER_CALCULATOR_COPY.differenceLabel}{' '}
            <output aria-live="polite" class="font-jost tabular-nums">
              {formatOverPowerValue(Math.max(targetDifference(), 0))}
            </output>
          </p>
          <div class="mt-5 flex flex-wrap items-end gap-2">
            <div class="min-w-40 flex-1">
              <OverPowerField
                fullWidth
                id="over-power-target-percent"
                label={OVER_POWER_CALCULATOR_COPY.targetPercentLabel}
                value={targetPercent()}
                max={CALCULATOR_PERCENT_MAX}
                decimalPlaces={CALCULATOR_PERCENT_DECIMALS}
                onChange={setTargetPercent}
              />
            </div>
            <div class="ml-auto flex shrink-0 justify-end gap-2">
              <For each={QUICK_TARGET_PERCENTS}>
                {(target) => (
                  <AppButton
                    variant="ghost"
                    class={`h-12 border ${getPossessionClassName(target.possession)} !text-[var(--cs-color-possession-text)] hover:brightness-95`}
                    size="sm"
                    onClick={() =>
                      setTargetPercent(
                        formatOverPowerInputValue(target.value, CALCULATOR_PERCENT_DECIMALS)
                      )
                    }
                  >
                    {target.label}
                  </AppButton>
                )}
              </For>
            </div>
          </div>
          <section class="mt-6 border-t border-border pt-5">
            <div class="mb-4 flex items-center gap-2">
              <h2 class="text-base font-semibold">
                {OVER_POWER_CALCULATOR_COPY.requiredChartCountTitle}
              </h2>
            </div>
            <OverPowerField
              id="over-power-chart-constant"
              label={OVER_POWER_CALCULATOR_COPY.chartConstantLabel}
              value={chartConstant()}
              min={CHART_CONST_MIN}
              max={CHART_CONST_MAX}
              step={0.1}
              decimalPlaces={1}
              onChange={setChartConstant}
            />
            <div class="mt-4 flex max-w-sm gap-2">
              <OverPowerField
                fullWidth
                id="over-power-current-chart-score"
                label={OVER_POWER_CALCULATOR_COPY.currentScoreLabel}
                value={currentChartScore()}
                max={SCORE_THEORETICAL_MAX}
                step={1}
                decimalPlaces={0}
                inputMode="numeric"
                onChange={setCurrentChartScore}
              />
              <OverPowerField
                fullWidth
                id="over-power-target-chart-score"
                label={OVER_POWER_CALCULATOR_COPY.targetScoreLabel}
                value={targetChartScore()}
                max={SCORE_THEORETICAL_MAX}
                step={1}
                decimalPlaces={0}
                inputMode="numeric"
                onChange={setTargetChartScore}
              />
            </div>
            <div class="mt-4 overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="border-b border-border text-text-muted">
                  <tr>
                    <th scope="col" class="px-2 py-2 text-left font-medium">
                      {OVER_POWER_CALCULATOR_COPY.lampLabel}
                    </th>
                    <th scope="col" class="px-2 py-2 text-right font-medium">
                      {OVER_POWER_CALCULATOR_COPY.requiredCountLabel}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <For each={requiredChartCounts()}>
                    {(cell) => (
                      <tr class="border-b border-border last:border-0">
                        <th scope="row" class="px-2 py-3 text-left font-medium">
                          {cell.label}
                        </th>
                        <td class="px-2 py-3 text-right font-jost tabular-nums">
                          {cell.count ?? OVER_POWER_CALCULATOR_COPY.unavailableCountLabel}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </section>
        </AppTabContent>

        <AppTabContent
          value="unplayed"
          class="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-6"
        >
          <Show
            when={authSession.status === 'authenticated'}
            fallback={
              <p class="text-sm text-text-muted">
                {OVER_POWER_CALCULATOR_COPY.loginRequiredMessage}
              </p>
            }
          >
            <p class="mb-1 text-sm text-text-muted">{OVER_POWER_CALCULATOR_COPY.resultLabel}</p>
            <output class="block font-jost text-4xl font-bold tabular-nums text-action-primary">
              {formatOverPowerPercent(unplayedCalculation().percent)}%
            </output>
            <p class="mt-2 font-jost text-sm tabular-nums text-text-muted">
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
                {OVER_POWER_CALCULATOR_COPY.unplayedModeLabel(unplayedSongCount())}
              </RadioGroup.Label>
              <div class="grid gap-2 sm:grid-cols-2">
                <For each={UNPLAYED_FILL_OPTIONS}>
                  {(option) => {
                    const label = () =>
                      option.value === 'playedAverage'
                        ? `${option.label} ${playedAverageScoreLabel()}`
                        : option.label
                    return (
                      <SelectableCardItem
                        value={option.value}
                        title={label()}
                        ariaLabel={label()}
                        density="compact"
                        titleClass="!font-normal"
                      />
                    )
                  }}
                </For>
              </div>
            </RadioGroup>
            <Show when={unplayedFillMode() === 'manual'}>
              <div class="mt-4">
                <OverPowerField
                  id="unplayed-over-power-manual-score"
                  label={OVER_POWER_CALCULATOR_COPY.manualScoreLabel}
                  value={manualFillScore()}
                  max={SCORE_THEORETICAL_MAX}
                  step={1}
                  inputMode="numeric"
                  onChange={setManualFillScore}
                />
              </div>
            </Show>
          </Show>
        </AppTabContent>
      </UnderlineTabs>
    </main>
  )
}

export default OverPowerCalculatorPage
