import { RadioGroup } from '@kobalte/core/radio-group'
import { TextField } from '@kobalte/core/text-field'
import { Calculator } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  type ChartConstantLamp,
  calculateChartConstant,
  MAX_CHART_CONSTANT_SCORE,
  MIN_CHART_CONSTANT_SCORE,
  resolveLampForScore,
} from '../../utils/chartConstantCalculator'
import { formatFixed } from '../../utils/numberFormat'
import {
  CHART_CONSTANT_CALCULATOR_COPY,
  CHART_CONSTANT_DEFAULTS,
  CHART_CONSTANT_LAMP_OPTIONS,
} from './chartConstantCalculator.constants'

const FIELD_CONTROL_CLASS =
  'min-h-12 rounded-md border border-border-strong bg-input-bg px-3 text-base text-text hover:border-input-border-hover'
const INPUT_CLASS = `${FIELD_CONTROL_CLASS} w-full py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring`

/**
 * フォームの数値文字列を計算用の数値へ変換する。
 *
 * @param value - 数値入力欄の現在値。
 * @returns 空欄の場合はNaN、それ以外は変換後の数値。
 */
const parseCalculatorNumber = (value: string): number =>
  value.trim() === '' ? Number.NaN : Number(value.replace(',', '.'))

/**
 * 譜面定数計算機の数値入力欄を表示する。
 *
 * @param props - 入力欄の識別子、ラベル、値、制約、変更ハンドラ。
 * @returns Kobalte TextFieldを使った数値入力欄。
 */
const CalculatorField: Component<{
  id: string
  label: string
  value: string
  min: number
  max?: number
  step: string
  inputMode: 'numeric' | 'decimal'
  onChange: (value: string) => void
}> = (props) => (
  <TextField class="block" value={props.value} onChange={props.onChange}>
    <TextField.Label class="mb-1 block text-sm font-medium text-text-muted" for={props.id}>
      {props.label}
    </TextField.Label>
    <TextField.Input
      id={props.id}
      name={props.id}
      type="text"
      class={INPUT_CLASS}
      inputMode={props.inputMode}
      pattern={props.inputMode === 'numeric' ? '[0-9]*' : '[0-9]*[.,]?[0-9]*'}
      min={props.min}
      max={props.max}
      step={props.step}
      required
    />
  </TextField>
)

/**
 * CHUNITHMの譜面定数計算機ページを表示する。
 *
 * @returns 計算フォームと推定譜面定数。
 */
const ChartConstantCalculatorPage = (): JSX.Element => {
  const [score, setScore] = createSignal<string>(CHART_CONSTANT_DEFAULTS.score)
  const [overPowerChange, setOverPowerChange] = createSignal(
    CHART_CONSTANT_DEFAULTS.overPowerChange
  )
  const [lamp, setLamp] = createSignal<ChartConstantLamp>(CHART_CONSTANT_DEFAULTS.lamp)

  useDocumentTitle(CHART_CONSTANT_CALCULATOR_COPY.title)

  /**
   * スコアを更新し、理論値ならランプをALL JUSTICE CRITICALへ合わせる。
   *
   * @param value - スコア入力欄の新しい値。
   * @returns なし。
   */
  const handleScoreChange = (value: string): void => {
    setScore(value)
    setLamp(resolveLampForScore(parseCalculatorNumber(value), lamp()))
  }

  /**
   * 現在のフォーム入力から譜面定数と検証エラーを導出する。
   *
   * @returns 計算結果、または入力値のエラーメッセージ。
   */
  const calculation = createMemo(() => {
    try {
      return {
        result: calculateChartConstant({
          score: parseCalculatorNumber(score()),
          overPower: parseCalculatorNumber(overPowerChange()),
          lamp: lamp(),
        }),
        errorMessage: null,
      }
    } catch (error) {
      return {
        result: null,
        errorMessage: error instanceof Error ? error.message : '入力値を確認してください。',
      }
    }
  })

  return (
    <main class="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <header class="flex items-start gap-3">
        <span class="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-muted">
          <Calculator class="h-5 w-5 text-action-primary" aria-hidden="true" />
        </span>
        <div>
          <h1 class="text-2xl font-semibold">{CHART_CONSTANT_CALCULATOR_COPY.title}</h1>
          <p class="mt-1 text-sm text-text-muted">{CHART_CONSTANT_CALCULATOR_COPY.description}</p>
        </div>
      </header>

      <section class="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <form class="space-y-5" onSubmit={(event) => event.preventDefault()}>
          <div class="grid gap-4 sm:grid-cols-2">
            <CalculatorField
              id="chart-constant-score"
              label={CHART_CONSTANT_CALCULATOR_COPY.scoreLabel}
              value={score()}
              min={MIN_CHART_CONSTANT_SCORE}
              max={MAX_CHART_CONSTANT_SCORE}
              step="1"
              inputMode="numeric"
              onChange={handleScoreChange}
            />
            <CalculatorField
              id="chart-constant-over-power-change"
              label={CHART_CONSTANT_CALCULATOR_COPY.overPowerChangeLabel}
              value={overPowerChange()}
              min={0}
              step="0.01"
              inputMode="decimal"
              onChange={setOverPowerChange}
            />
          </div>

          <RadioGroup
            name="chart-constant-lamp"
            value={lamp()}
            onChange={(value) => setLamp(value as ChartConstantLamp)}
            class="space-y-1"
          >
            <RadioGroup.Label class="block text-sm font-medium text-text-muted">
              {CHART_CONSTANT_CALCULATOR_COPY.lampLabel}
            </RadioGroup.Label>
            <div class="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              <For each={CHART_CONSTANT_LAMP_OPTIONS}>
                {(option) => (
                  <RadioGroup.Item
                    value={option.value}
                    class={`${FIELD_CONTROL_CLASS} relative flex items-center gap-3 py-3 hover:bg-surface-muted data-[checked]:border-action-primary data-[checked]:bg-action-primary-muted`}
                  >
                    <RadioGroup.ItemInput class="peer" />
                    <RadioGroup.ItemControl class="pointer-events-none flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-input-bg data-[checked]:border-action-primary">
                      <RadioGroup.ItemIndicator class="h-2.5 w-2.5 rounded-full bg-action-primary" />
                    </RadioGroup.ItemControl>
                    <span class="pointer-events-none">{option.label}</span>
                    <RadioGroup.ItemLabel class="absolute inset-0 cursor-pointer rounded focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring">
                      <span class="sr-only">{option.label}</span>
                    </RadioGroup.ItemLabel>
                  </RadioGroup.Item>
                )}
              </For>
            </div>
          </RadioGroup>
        </form>
      </section>

      <section aria-live="polite" class="rounded-lg border border-border bg-surface p-4 sm:p-6">
        <Show
          when={calculation().result}
          fallback={<p class="text-sm text-danger">{calculation().errorMessage}</p>}
        >
          {(result) => (
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-sm font-medium text-text-muted">
                  {CHART_CONSTANT_CALCULATOR_COPY.resultLabel}
                </p>
                <output class="mt-1 block text-4xl font-bold tabular-nums text-action-primary">
                  {formatFixed(result().estimatedChartConstant, 1)}
                </output>
              </div>
              <p class="text-sm text-text-muted">
                {CHART_CONSTANT_CALCULATOR_COPY.rawResultLabel}:{' '}
                <span class="font-medium tabular-nums text-text">
                  {formatFixed(result().rawChartConstant, 4)}
                </span>
              </p>
            </div>
          )}
        </Show>
      </section>
    </main>
  )
}

export default ChartConstantCalculatorPage
