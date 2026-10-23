import { type Accessor, createEffect, createSignal, untrack } from 'solid-js'
import {
  calculateOverPowerPercent,
  formatOverPowerInputValue,
  normalizeOverPowerCalculatorInput,
  type OverPowerCalculatorBase,
  reconcileOverPowerCalculatorValue,
} from '../utils/overPowerCalculator'
import {
  CALCULATOR_PERCENT_DECIMALS,
  CALCULATOR_VALUE_DECIMALS,
} from '../utils/overPowerCalculatorConstants'

/**
 * 計算機の自動集計と編集済み入力をユーザー単位で同期する。
 *
 * @param username - 認証ユーザー。未ログイン時はundefined。
 * @param base - 現在ユーザーの集計値。読み込み中・失敗時はundefined。
 * @param selectionKey - 未解禁設定から生成した、集計対象を識別するキー。
 * @returns 各入力のAccessorと、編集済みとして更新する関数。
 */
export const createOverPowerCalculatorInputs = (
  username: Accessor<string | undefined>,
  base: Accessor<OverPowerCalculatorBase | undefined>,
  selectionKey: Accessor<string>
) => {
  const [maxValue, setMaxValue] = createSignal(formatOverPowerInputValue(0))
  const [currentValue, setCurrentValue] = createSignal(formatOverPowerInputValue(0))
  const [targetPercent, setTargetPercent] = createSignal(
    formatOverPowerInputValue(0, CALCULATOR_PERCENT_DECIMALS)
  )
  // 表示を0に制限した場合も、対象を戻したときに編集分を復元する。
  let rawMaxValue = formatOverPowerInputValue(0)
  let rawCurrentValue = formatOverPowerInputValue(0)
  let inputUsername = untrack(username)
  let previousBase: OverPowerCalculatorBase | undefined
  let previousSelectionKey: string | undefined
  let maxEdited = false
  let currentEdited = false
  let targetEdited = false

  createEffect(() => {
    const nextUsername = username()
    const nextBase = base()
    const nextSelectionKey = selectionKey()
    // 入力編集を集計Effectの依存関係に含めない。
    untrack(() => {
      if (inputUsername !== nextUsername) {
        inputUsername = nextUsername
        previousBase = undefined
        previousSelectionKey = undefined
        maxEdited = false
        currentEdited = false
        targetEdited = false
        rawMaxValue = formatOverPowerInputValue(0)
        rawCurrentValue = formatOverPowerInputValue(0)
        setMaxValue(rawMaxValue)
        setCurrentValue(rawCurrentValue)
        setTargetPercent(formatOverPowerInputValue(0, CALCULATOR_PERCENT_DECIMALS))
      }
      if (!nextUsername || !nextBase) return

      const selectionChanged =
        previousSelectionKey !== undefined && previousSelectionKey !== nextSelectionKey
      rawMaxValue = reconcileOverPowerCalculatorValue(
        rawMaxValue,
        previousBase?.max,
        nextBase.max,
        maxEdited,
        selectionChanged
      )
      rawCurrentValue = reconcileOverPowerCalculatorValue(
        rawCurrentValue,
        previousBase?.current,
        nextBase.current,
        currentEdited,
        selectionChanged
      )
      setMaxValue(normalizeOverPowerCalculatorInput(rawMaxValue, CALCULATOR_VALUE_DECIMALS))
      setCurrentValue(normalizeOverPowerCalculatorInput(rawCurrentValue, CALCULATOR_VALUE_DECIMALS))
      if (!previousBase && !targetEdited) {
        setTargetPercent(
          formatOverPowerInputValue(
            calculateOverPowerPercent(nextBase.current, nextBase.max),
            CALCULATOR_PERCENT_DECIMALS
          )
        )
      }
      previousBase = nextBase
      previousSelectionKey = nextSelectionKey
    })
  })

  /**
   * 満点を編集済みとして保存する。
   * @param value - 固定小数表記の入力値。
   * @returns なし。
   */
  const editMaxValue = (value: string): void => {
    maxEdited = true
    rawMaxValue = value
    setMaxValue(value)
  }
  /**
   * 獲得値を編集済みとして保存する。加算による更新も含む。
   * @param value - 固定小数表記の入力値。
   * @returns なし。
   */
  const editCurrentValue = (value: string): void => {
    currentEdited = true
    rawCurrentValue = value
    setCurrentValue(value)
  }
  /**
   * 目標達成率を編集済みとして保存する。クイック入力も含む。
   * @param value - 固定小数表記の入力値。
   * @returns なし。
   */
  const editTargetPercent = (value: string): void => {
    targetEdited = true
    setTargetPercent(value)
  }

  return {
    maxValue,
    currentValue,
    targetPercent,
    setMaxValue: editMaxValue,
    setCurrentValue: editCurrentValue,
    setTargetPercent: editTargetPercent,
  }
}
