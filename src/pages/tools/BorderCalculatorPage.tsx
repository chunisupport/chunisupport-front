import { Button } from '@kobalte/core/button'
import { Checkbox } from '@kobalte/core/checkbox'
import { TextField } from '@kobalte/core/text-field'
import { Check, Target } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { createSignal, For, Show } from 'solid-js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import {
  type BorderCalculatorResult,
  CHUNITHM_THEORETICAL_SCORE,
  calculateBorder,
} from '../../utils/borderCalculator'

const BORDER_CALCULATOR_COPY = {
  title: 'ボーダー計算機',
  description: 'ノーツ数と目標スコアから、目標達成に許容される判定数を計算します。',
  notesLabel: 'ノーツ数',
  targetScoreLabel: '目標スコア',
  targetJusticeLabel: '目標JUSTICE数',
  targetJusticeHelp: '空欄の場合はJUSTICE数を制限せずに候補を表示します。',
  fullComboOnlyLabel: 'FULL COMBO指定（MISSを0に固定）',
  submitLabel: '計算する',
  unreachableMessage: '理論値を超えるため到達不能です。',
  noCandidatesMessage: '条件に合う候補はありません。',
} as const

const DEFAULT_NOTES = '2800'
const DEFAULT_TARGET_SCORE = '1007500'
const FIELD_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-input-bg px-3 py-2 text-sm text-text hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
const CHECKBOX_CONTROL_CLASS =
  'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse'

type BorderFormFieldProps = {
  id: string
  label: string
  value: string
  required?: boolean
  helpText?: string
  onChange: (value: string) => void
}

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
      aria-describedby={props.helpText ? `${props.id}-help` : undefined}
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
    <div class="overflow-x-auto rounded border border-border">
      <table class="min-w-full divide-y divide-border text-right text-sm">
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
            <th scope="col" class="px-3 py-2">
              SCORE
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
                <td class="px-3 py-2 text-text">{formatNumber(candidate.score)}</td>
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
  const [notes, setNotes] = createSignal(DEFAULT_NOTES)
  const [targetScore, setTargetScore] = createSignal(DEFAULT_TARGET_SCORE)
  const [targetJustice, setTargetJustice] = createSignal('')
  const [fullComboOnly, setFullComboOnly] = createSignal(false)
  const [result, setResult] = createSignal<BorderCalculatorResult | null>(null)
  const [errorMessage, setErrorMessage] = createSignal('')

  useDocumentTitle(BORDER_CALCULATOR_COPY.title)

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

      <section class="rounded-lg border border-border bg-surface p-4">
        <form class="space-y-4" onSubmit={handleSubmit}>
          <div class="grid gap-4 sm:grid-cols-2">
            <BorderFormField
              id="notes"
              label={BORDER_CALCULATOR_COPY.notesLabel}
              value={notes()}
              required
              onChange={setNotes}
            />
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
              helpText={BORDER_CALCULATOR_COPY.targetJusticeHelp}
              onChange={setTargetJustice}
            />
            <div class="flex items-end">
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
      </section>

      <Show when={result()}>
        {(currentResult) => (
          <section class="rounded-lg border border-border bg-surface p-4">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-lg font-semibold">計算結果</h2>
              <p class="text-xs text-text-muted">
                理論値 {formatNumber(CHUNITHM_THEORETICAL_SCORE)}
              </p>
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
    </main>
  )
}

export default BorderCalculatorPage
