import { type Accessor, createEffect, createSignal, onMount, type Setter } from 'solid-js'
import {
  createInitialSortConditions,
  nextPrimarySortCondition,
  normalizeSortConditions,
  type SortCondition,
} from '../utils/sortConditions'
import { type SortDirection, type SortParamsSource, sanitizeSortQuery } from '../utils/sortingQuery'
import { createHistoryViewState } from './createHistoryViewState'

/** レコード画面の表示状態を初期化するための種別固有の設定 */
export type RecordViewStateOptions<
  TFilter,
  TColumnId extends string,
  TSortKey extends string,
  TRestoreSource,
> = {
  /** 履歴復元用キャッシュを区別するキー（ユーザー名など）。 */
  key: Accessor<string>
  /** 復元完了前に使う仮のフィルター。 */
  initialFilter: TFilter
  /** フィルター復元に必要なデータ。揃うまでは undefined を返す。 */
  filterRestoreSource: Accessor<TRestoreSource | undefined>
  /** 保存済み設定、または既定値から初期フィルターを決定する。 */
  restoreFilter: (source: TRestoreSource) => Promise<TFilter>
  /** リセット時に適用する既定フィルター。 */
  defaultFilter: Accessor<TFilter>
  /** フィルターを永続化する。 */
  saveFilter: (filter: TFilter) => Promise<void>
  /** 保存済み設定がない場合の表示列。 */
  defaultColumnIds: TColumnId[]
  /** 表示列 ID を正規化する。 */
  sanitizeColumnIds: (columnIds: TColumnId[]) => TColumnId[]
  /** 保存済みの表示列設定を読み込む。 */
  readColumns: () => Promise<unknown>
  /** 表示列設定を永続化する。 */
  saveColumns: (columnIds: TColumnId[]) => Promise<void>
  /** 常に適用する既定ソート条件。 */
  defaultSortConditions: SortCondition<TSortKey>[]
  /** URL クエリから第1ソートを読み取る。 */
  parseSortParams: (searchParams: SortParamsSource) => {
    initialSortKey: TSortKey
    initialSortOrder: SortDirection
  }
  /** 現在の URL 検索パラメータ。 */
  searchParams: SortParamsSource
  /** URL 検索パラメータを更新する。 */
  setSearchParams: Parameters<typeof sanitizeSortQuery>[1]
}

/** レコード画面で共通に扱う表示状態と操作 */
export type RecordViewState<TFilter, TColumnId extends string, TSortKey extends string> = {
  /** 現在のフィルター。 */
  filters: Accessor<TFilter>
  /** 永続化せずにフィルターを更新する。 */
  setFilters: Setter<TFilter>
  /** フィルターを反映して永続化する。 */
  applyFilters: (nextFilters: TFilter) => void
  /** 他画面から渡されたフィルターを、保存済み設定の復元より優先して反映する。 */
  overrideFilter: (nextFilters: TFilter) => void
  /** 現在の表示列 ID。 */
  visibleColumnIds: Accessor<TColumnId[]>
  /** 表示列を正規化して反映し、永続化する。 */
  applyVisibleColumns: (nextColumnIds: TColumnId[]) => void
  /** 現在の複数条件ソート。 */
  sortConditions: Accessor<SortCondition<TSortKey>[]>
  /** ソート条件をまとめて更新する。 */
  setSortConditions: Setter<SortCondition<TSortKey>[]>
  /** 第1ソート条件。 */
  primarySort: Accessor<SortCondition<TSortKey> | null>
  /** 列ヘッダー操作で第1ソートを進める。 */
  handleSortChange: (nextKey: TSortKey) => void
  /** フィルターとソートを既定値へ戻す。 */
  resetFiltersAndSort: () => void
  /** フィルター統計の開閉状態。 */
  filterStatsOpen: Accessor<boolean>
  /** フィルター統計の開閉状態を更新する。 */
  setFilterStatsOpen: Setter<boolean>
  /** フィルターと表示列の復元が完了したか。 */
  ready: Accessor<boolean>
}

/**
 * レコード画面の復元・永続化・リセット・表示列・主ソートを扱う Primitive を作成する。
 * 履歴復元用のキャッシュを画面種別ごとに分けるため、モジュールのトップレベルで1回呼び出す。
 *
 * @typeParam TFilter - フィルター状態の型。
 * @typeParam TColumnId - 表示列 ID の型。
 * @typeParam TSortKey - ソートキーの型。
 * @typeParam TRestoreSource - フィルター復元に必要なデータの型。
 * @returns コンポーネント内で呼び出す表示状態 Primitive。
 */
export const createRecordViewState = <
  TFilter,
  TColumnId extends string,
  TSortKey extends string,
  TRestoreSource,
>() => {
  const useSortState = createHistoryViewState<SortCondition<TSortKey>[]>()
  const useStatsState = createHistoryViewState<boolean>()

  /**
   * レコード画面の表示状態を初期化する。
   *
   * @param options - 種別固有のフィルター、表示列、ソートの設定。
   * @returns 表示状態の accessor と操作関数。
   */
  return (
    options: RecordViewStateOptions<TFilter, TColumnId, TSortKey, TRestoreSource>
  ): RecordViewState<TFilter, TColumnId, TSortKey> => {
    const [filters, setFilters] = createSignal<TFilter>(options.initialFilter)
    const [filterReady, setFilterReady] = createSignal(false)
    const [visibleColumnIds, setVisibleColumnIds] = createSignal<TColumnId[]>(
      options.sanitizeColumnIds(options.defaultColumnIds)
    )
    const [columnsReady, setColumnsReady] = createSignal(false)
    const [filterStatsOpen, setFilterStatsOpen] = useStatsState(options.key, () => false)

    /**
     * URL クエリの第1ソートと既定の後続ソートから初期ソート条件を作る。
     *
     * @returns 初期ソート条件。
     */
    const createSortConditionsFromQuery = (): SortCondition<TSortKey>[] => {
      const { initialSortKey, initialSortOrder } = options.parseSortParams(options.searchParams)
      return createInitialSortConditions(
        initialSortKey,
        initialSortOrder,
        options.defaultSortConditions
      )
    }

    const [sortConditions, setSortConditions] = useSortState(
      options.key,
      createSortConditionsFromQuery
    )
    const primarySort = () => sortConditions()[0] ?? null

    // クエリパラメータのソートを反映してからURLをクリーン化する。
    createEffect(() => {
      if (!options.searchParams.sortcol && !options.searchParams.sortorder) return
      setSortConditions(createSortConditionsFromQuery())
      sanitizeSortQuery(options.searchParams, options.setSearchParams)
    })

    let filterRestoreStarted = false
    let filterOverridden = false

    // 復元に必要なデータが揃った時点で、保存済みフィルターまたは既定フィルターを1回だけ反映する。
    createEffect(() => {
      const source = options.filterRestoreSource()
      if (filterRestoreStarted || source === undefined) return
      filterRestoreStarted = true
      void options
        .restoreFilter(source)
        .then((restoredFilter) => {
          if (!filterOverridden) setFilters(() => restoredFilter)
        })
        .finally(() => setFilterReady(true))
    })

    onMount(() => {
      void options
        .readColumns()
        .then((savedColumnIds) => {
          if (Array.isArray(savedColumnIds)) {
            setVisibleColumnIds(options.sanitizeColumnIds(savedColumnIds as TColumnId[]))
          }
        })
        .catch(() => undefined)
        .finally(() => setColumnsReady(true))
    })

    /**
     * フィルターを画面へ反映し、永続化する。永続化の失敗は無視する。
     *
     * @param nextFilters - 次に適用するフィルター状態。
     * @returns なし。
     */
    const applyFilters = (nextFilters: TFilter) => {
      setFilters(() => nextFilters)
      void options.saveFilter(nextFilters).catch(() => undefined)
    }

    /**
     * 他画面から渡されたフィルターを反映する。以後に完了した復元結果では上書きしない。
     *
     * @param nextFilters - 次に適用するフィルター状態。
     * @returns なし。
     */
    const overrideFilter = (nextFilters: TFilter) => {
      filterOverridden = true
      setFilters(() => nextFilters)
      setFilterReady(true)
    }

    /**
     * 表示列を正規化して画面へ反映し、永続化する。永続化の失敗は無視する。
     *
     * @param nextColumnIds - 次に表示する列 ID 配列。
     * @returns なし。
     */
    const applyVisibleColumns = (nextColumnIds: TColumnId[]) => {
      const sanitizedColumnIds = options.sanitizeColumnIds(nextColumnIds)
      setVisibleColumnIds(sanitizedColumnIds)
      void options.saveColumns(sanitizedColumnIds).catch(() => undefined)
    }

    /**
     * 指定された列で第1ソート状態を進め、後続条件を補正する。
     *
     * @param nextKey - 次に第1ソート対象にする列キー。
     * @returns なし。
     */
    const handleSortChange = (nextKey: TSortKey) => {
      const nextPrimarySort = nextPrimarySortCondition(primarySort(), nextKey)
      setSortConditions((currentSortConditions) =>
        normalizeSortConditions(
          [nextPrimarySort, ...currentSortConditions.slice(1)],
          options.defaultSortConditions
        )
      )
    }

    /**
     * フィルターとソート条件を既定値へ戻し、フィルターを永続化する。
     *
     * @returns なし。
     */
    const resetFiltersAndSort = () => {
      applyFilters(options.defaultFilter())
      setSortConditions(options.defaultSortConditions.map((condition) => ({ ...condition })))
    }

    return {
      filters,
      setFilters,
      applyFilters,
      overrideFilter,
      visibleColumnIds,
      applyVisibleColumns,
      sortConditions,
      setSortConditions,
      primarySort,
      handleSortChange,
      resetFiltersAndSort,
      filterStatsOpen,
      setFilterStatsOpen,
      ready: () => filterReady() && columnsReady(),
    }
  }
}
