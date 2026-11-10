import { type Accessor, createMemo, createSignal } from 'solid-js'
import type {
  RegisterScoreAggregateRowKey,
  RegisterScoreAggregateRowVisibility,
} from './registerScoreStatistics'

/** 集計セクションの表示状態を生成するための入力 */
export type RegisterScoreAggregateSectionStateOptions<
  Row extends { key: RegisterScoreAggregateRowKey },
> = {
  /** 全体および難易度別の集計行 */
  rows: Accessor<readonly Row[]>
  /** 集計行ごとの初期表示状態 */
  initialRowVisibility: RegisterScoreAggregateRowVisibility
}

/** TOTAL HIGH SCOREやRECORD STATISTICSなど、1集計セクション分の表示状態 */
export type RegisterScoreAggregateSectionState<Row extends { key: RegisterScoreAggregateRowKey }> =
  {
    /** 集計セクションを表示設定で有効にしているか */
    enabled: Accessor<boolean>
    /** 集計セクションを表示設定で有効にするかを更新する */
    setEnabled: (enabled: boolean) => void
    /** 集計行ごとの表示設定 */
    rowVisibility: Accessor<RegisterScoreAggregateRowVisibility>
    /** 1行分の表示設定を更新する */
    setRowVisible: (key: RegisterScoreAggregateRowKey, visible: boolean) => void
    /** 表示設定で有効にした集計行 */
    visibleRows: Accessor<Row[]>
    /** セクションが有効で、表示する集計行が1行以上あるか */
    displayed: Accessor<boolean>
  }

/**
 * 更新差分レポートの1集計セクションについて、セクションと集計行の表示状態を管理する。
 *
 * @param options - 集計行と行ごとの初期表示状態。
 * @returns 表示設定、表示対象の集計行、レポートへ表示するか、および各設定の更新関数。
 */
export const createRegisterScoreAggregateSectionState = <
  Row extends { key: RegisterScoreAggregateRowKey },
>(
  options: RegisterScoreAggregateSectionStateOptions<Row>
): RegisterScoreAggregateSectionState<Row> => {
  const [enabled, setEnabled] = createSignal(true)
  const [rowVisibility, setRowVisibility] = createSignal<RegisterScoreAggregateRowVisibility>(
    options.initialRowVisibility
  )
  const visibleRows = createMemo(() => options.rows().filter((row) => rowVisibility()[row.key]))
  const displayed = createMemo(() => enabled() && visibleRows().length > 0)

  return {
    enabled,
    /**
     * 集計セクションを表示設定で有効にするかを更新する。
     *
     * @param nextEnabled - 有効にする場合はtrue。
     * @returns なし。
     */
    setEnabled: (nextEnabled) => {
      setEnabled(nextEnabled)
    },
    rowVisibility,
    /**
     * 1行分の表示設定を更新する。
     *
     * @param key - 更新する集計行のキー。
     * @param visible - 更新後の表示状態。
     * @returns なし。
     */
    setRowVisible: (key, visible) => {
      setRowVisibility((current) => ({ ...current, [key]: visible }))
    },
    visibleRows,
    displayed,
  }
}
