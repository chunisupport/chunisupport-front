import { createSignal } from 'solid-js'
import type { ChartConstRangeFieldProps } from '../components/common/ChartConstRangeField'
import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import type { NumericRangeFilter } from '../types/record'
import {
  type ChartLevelLabel,
  getChartLevelFilterBoundary,
  toChartLevelFilterLabel,
} from '../utils/chartLevel'
import { parseNumberInput, toInputValue } from '../utils/rangeInput'

/** レベルまたは譜面定数で指定する範囲条件 */
export type ChartConstRangeSelection = {
  constFilterMode: 'level' | 'number'
  constRange: NumericRangeFilter
}

/** 範囲入力 Primitive の戻り値 */
export type ChartConstRangeDraft = {
  /** 指定した範囲を入力欄とレベル選択の表示値へ反映する */
  sync: (range: NumericRangeFilter) => void
  /** `ChartConstRangeField` へスプレッドして渡すプロパティ */
  fieldProps: Omit<ChartConstRangeFieldProps, 'idPrefix'>
}

type CreateChartConstRangeDraftOptions = {
  /** 編集中の範囲条件を返す */
  get: () => ChartConstRangeSelection
  /** 編集中の範囲条件を更新する */
  set: (next: ChartConstRangeSelection) => void
}

/**
 * `ChartConstRangeField` の入力表示値と、編集中の範囲条件の同期を管理する。
 *
 * @param options - 編集中の範囲条件の取得・更新関数。
 * @returns 表示値の同期関数と、`ChartConstRangeField` へ渡すプロパティ。
 */
export const createChartConstRangeDraft = (
  options: CreateChartConstRangeDraftOptions
): ChartConstRangeDraft => {
  const initial = options.get().constRange
  const [minInput, setMinInput] = createSignal(toInputValue(initial.min))
  const [maxInput, setMaxInput] = createSignal(toInputValue(initial.max))
  const [levelMin, setLevelMin] = createSignal<string>(toChartLevelFilterLabel(initial.min))
  const [levelMax, setLevelMax] = createSignal<string>(toChartLevelFilterLabel(initial.max))

  /**
   * 指定した範囲を入力欄とレベル選択の表示値へ反映する。
   *
   * @param range - 表示へ反映する範囲。
   * @returns なし。
   */
  const sync = (range: NumericRangeFilter): void => {
    setMinInput(toInputValue(range.min))
    setMaxInput(toInputValue(range.max))
    setLevelMin(toChartLevelFilterLabel(range.min))
    setLevelMax(toChartLevelFilterLabel(range.max))
  }

  /**
   * 範囲の片側だけを更新する。
   *
   * @param endpoint - 更新する範囲の端点。
   * @param value - 新しい端点の値。
   * @returns なし。
   */
  const updateEndpoint = (endpoint: 'min' | 'max', value: number): void => {
    const current = options.get()
    options.set({ ...current, constRange: { ...current.constRange, [endpoint]: value } })
  }

  /**
   * 譜面定数の入力値を範囲の端点へ確定する。空欄は全範囲の端点として扱う。
   *
   * @param endpoint - 更新する範囲の端点。
   * @param value - 入力欄の文字列。
   * @returns なし。
   */
  const commitNumber = (endpoint: 'min' | 'max', value: string): void => {
    const fallback = endpoint === 'min' ? CHART_CONST_MIN : CHART_CONST_MAX
    const nextValue = parseNumberInput(value) ?? fallback
    if (endpoint === 'min') setMinInput(toInputValue(nextValue))
    else setMaxInput(toInputValue(nextValue))
    updateEndpoint(endpoint, nextValue)
  }

  /**
   * 選択した表示レベルを譜面定数範囲へ反映する。
   *
   * @param endpoint - 更新する範囲の端点。
   * @param value - 選択した表示レベル。
   * @returns なし。
   */
  const changeLevel = (endpoint: 'min' | 'max', value: string): void => {
    const nextValue = getChartLevelFilterBoundary(value as ChartLevelLabel, endpoint)
    if (endpoint === 'min') {
      setLevelMin(value)
      setMinInput(toInputValue(nextValue))
    } else {
      setLevelMax(value)
      setMaxInput(toInputValue(nextValue))
    }
    updateEndpoint(endpoint, nextValue)
  }

  /**
   * レベルと譜面定数の入力モードを切り替える。レベルへ戻す場合は範囲をレベル境界へ丸める。
   *
   * @param mode - 切り替え後の入力モード。
   * @returns なし。
   */
  const changeMode = (mode: 'level' | 'number'): void => {
    const { constRange } = options.get()
    if (mode === 'number') {
      setMinInput(toInputValue(constRange.min))
      setMaxInput(toInputValue(constRange.max))
      options.set({ constFilterMode: mode, constRange })
      return
    }
    const minLevel = toChartLevelFilterLabel(constRange.min)
    const maxLevel = toChartLevelFilterLabel(constRange.max)
    setLevelMin(minLevel)
    setLevelMax(maxLevel)
    options.set({
      constFilterMode: mode,
      constRange: {
        min: getChartLevelFilterBoundary(minLevel, 'min'),
        max: getChartLevelFilterBoundary(maxLevel, 'max'),
      },
    })
  }

  return {
    sync,
    /** `ChartConstRangeField` へスプレッドして渡すプロパティ（getterでリアクティブ性を保つ） */
    fieldProps: {
      get constFilterMode() {
        return options.get().constFilterMode
      },
      get minValue() {
        return minInput()
      },
      get maxValue() {
        return maxInput()
      },
      get constLevelMin() {
        return levelMin()
      },
      get constLevelMax() {
        return levelMax()
      },
      onMinInput: setMinInput,
      onMaxInput: setMaxInput,
      onMinCommit: (value: string) => commitNumber('min', value),
      onMaxCommit: (value: string) => commitNumber('max', value),
      onConstFilterModeChange: changeMode,
      onConstLevelChange: changeLevel,
    },
  }
}
