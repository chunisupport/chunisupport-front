import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { Gauge, LockKeyhole, Plus } from 'lucide-solid'
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
import { AppButton } from '../../components/common/AppButton'
import { CheckboxField } from '../../components/common/CheckboxField'
import { SelectableCardItem } from '../../components/common/SelectableCardButton'
import { OVER_POWER_CALCULATOR_PATH } from '../../constants/routes'
import { getToolLink } from '../../constants/tools'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { authSession } from '../../stores/authSession'
import { useSongsData } from '../../stores/songsData'
import type { PlayerLockedSongRequest } from '../../types/api'
import { fetchUserRecordWithCache } from '../../usecases/cache/fetchUserRecordWithCache'
import { buildOverPowerCalculatorData } from '../../usecases/overpower/calculator'
import { buildLockedSongsBatchPayload } from '../../usecases/overpower/lockedSongsBatch'
import {
  calculateOverPowerDifference,
  calculateOverPowerPercent,
  calculateRequiredOverPower,
  calculateUnplayedOverPower,
  formatOverPowerInputValue,
  formatSignedOverPowerValue,
  parseOverPowerInput,
  type UnplayedOverPowerFillMode,
} from '../../utils/overPowerCalculator'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { normalizeScoreRangeInput } from '../../utils/rangeInput'
import LockedSongsDialog from '../users/UserOverPower/components/LockedSongsDialog'
import {
  BORDER_PERCENTS,
  DEFAULT_MANUAL_FILL_SCORE,
  OVER_POWER_CALCULATOR_COPY,
  UNPLAYED_FILL_OPTIONS,
} from './overPowerCalculator.constants'

/** OVER POWER計算機の数値入力欄の表示と更新設定。 */
type OverPowerFieldProps = {
  id: string
  label: string
  value: string
  min?: number
  max?: number
  step?: string
  inputMode?: 'numeric' | 'decimal'
  onChange: (value: string) => void
}

/** 数値入力のスタイル。自由入力にはsans系フォントを使用する。 */
const INPUT_CLASS =
  'min-h-12 w-full rounded-md border border-border-strong bg-input-bg px-3 py-3 text-right font-sans text-base tabular-nums text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * OVER POWER計算機の数値入力欄を描画する。
 *
 * @param props - 入力欄ID、ラベル、値、数値制約、入力モードと更新通知先。
 * @returns Kobalte TextFieldによる数値入力欄。
 */
const OverPowerField: Component<OverPowerFieldProps> = (props) => (
  <TextField class="block" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block text-sm font-medium text-text-muted" for={props.id}>
      {props.label}
    </TextField.Label>
    <TextField.Input
      id={props.id}
      name={props.id}
      type="text"
      class={INPUT_CLASS}
      inputMode={props.inputMode ?? 'decimal'}
      pattern={props.inputMode === 'numeric' ? '[0-9]*' : '[0-9]*[.,]?[0-9]*'}
      min={props.min}
      max={props.max}
      step={props.step}
      required
    />
  </TextField>
)

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
  const [unlockLockedSongs, setUnlockLockedSongs] = createSignal(false)
  const [unplayedFillMode, setUnplayedFillMode] = createSignal<UnplayedOverPowerFillMode>('none')
  const [manualFillScore, setManualFillScore] = createSignal(DEFAULT_MANUAL_FILL_SCORE)
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
      : `${Math.round(score).toLocaleString('ja-JP')}${OVER_POWER_CALCULATOR_COPY.manualScoreSuffix}`
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
          <h1 class="text-2xl font-semibold">{tool.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{tool.description}</p>
        </div>
      </header>

      <Show when={importLoading() && authenticatedUsername()}>
        <Loading />
      </Show>
      <Show when={importError() && authenticatedUsername()}>
        <LoadError error={importError()} />
      </Show>

      <Show when={authSession.status === 'authenticated'}>
        <div class="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <CheckboxField
            checked={unlockLockedSongs()}
            onChange={setUnlockLockedSongs}
            label={OVER_POWER_CALCULATOR_COPY.unlockLockedSongsLabel}
          />
          <AppButton
            type="button"
            variant="surface"
            shape="pill"
            class="min-h-10"
            aria-label={OVER_POWER_CALCULATOR_COPY.lockedSongsSettingsLabel}
            title={OVER_POWER_CALCULATOR_COPY.lockedSongsSettingsLabel}
            disabled={lockedSongsButtonDisabled()}
            onClick={() => setLockedSongsDialogOpen(true)}
          >
            <span>{OVER_POWER_CALCULATOR_COPY.lockedSongsButtonLabel}</span>
            <LockKeyhole class="h-5 w-5" aria-hidden="true" />
          </AppButton>
        </div>
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

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 class="text-lg font-semibold">{OVER_POWER_CALCULATOR_COPY.valueToPercentTitle}</h2>
          <output class="mt-4 block text-4xl font-bold font-jost tabular-nums text-action-primary">
            {formatOverPowerPercent(currentPercent())}%
          </output>
          <div class="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
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
          <div class="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <OverPowerField
              id="over-power-add-value"
              label={OVER_POWER_CALCULATOR_COPY.addValueLabel}
              value={addValue()}
              onChange={setAddValue}
            />
            <AppButton type="button" variant="primary" class="min-h-12" onClick={handleAddValue}>
              <Plus class="h-4 w-4" aria-hidden="true" />
              {OVER_POWER_CALCULATOR_COPY.addButtonLabel}
            </AppButton>
          </div>
        </section>

        <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <h2 class="text-lg font-semibold">{OVER_POWER_CALCULATOR_COPY.percentToValueTitle}</h2>
          <output class="mt-4 block text-4xl font-bold font-jost tabular-nums text-action-primary">
            {formatSignedOverPowerValue(targetDifference())}
          </output>
          <p class="mt-1 text-sm text-text-muted">{OVER_POWER_CALCULATOR_COPY.differenceLabel}</p>
          <div class="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
            <div>
              <p class="mb-1 text-sm font-medium text-text-muted">
                {OVER_POWER_CALCULATOR_COPY.requiredValueLabel}
              </p>
              <output class="block rounded border border-border bg-surface-muted px-3 py-2 text-right font-jost text-sm tabular-nums text-text">
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
          <output class="mt-4 block text-4xl font-bold font-jost tabular-nums text-action-primary">
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
              {OVER_POWER_CALCULATOR_COPY.unplayedModeLabel}（{unplayedSongCount()}
              {OVER_POWER_CALCULATOR_COPY.songCountSuffix}）
            </RadioGroup.Label>
            <div class="grid gap-2 sm:grid-cols-2">
              <For each={UNPLAYED_FILL_OPTIONS}>
                {(option) => (
                  <SelectableCardItem
                    value={option.value}
                    title={option.label}
                    ariaLabel={option.label}
                    density="compact"
                    description={
                      option.value === 'playedAverage'
                        ? playedAverageScoreLabel()
                        : 'description' in option
                          ? option.description
                          : undefined
                    }
                  />
                )}
              </For>
            </div>
          </RadioGroup>
          <Show when={unplayedFillMode() === 'manual'}>
            <div class="mt-4 sm:max-w-xs">
              <OverPowerField
                id="unplayed-over-power-manual-score"
                label={OVER_POWER_CALCULATOR_COPY.manualScoreLabel}
                value={manualFillScore()}
                inputMode="numeric"
                onChange={(value) => {
                  const normalized = normalizeScoreRangeInput(value)
                  if (normalized !== null) setManualFillScore(normalized)
                }}
              />
            </div>
          </Show>
        </Show>
      </section>
    </main>
  )
}

export default OverPowerCalculatorPage
