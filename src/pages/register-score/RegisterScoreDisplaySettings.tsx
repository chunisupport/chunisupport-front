import { For } from 'solid-js'
import { AppSelect } from '../../components/common/AppSelect'
import { CheckboxField } from '../../components/common/CheckboxField'
import type { SortDirection } from '../../utils/sortingQuery'
import { REGISTER_SCORE_COPY } from './constants'
import {
  REGISTER_SCORE_PRIMARY_SORT_OPTIONS,
  REGISTER_SCORE_SORT_DIRECTION_OPTIONS,
  type RegisterScorePrimarySortKey,
  type RegisterScoreSortDirectionOption,
} from './registerScoreSorting'
import {
  REGISTER_SCORE_AGGREGATE_ROW_OPTIONS,
  type RegisterScoreAggregateRowKey,
  type RegisterScoreAggregateRowVisibility,
} from './registerScoreStatistics'

/**
 * 集計セクションと行ごとの表示設定を共通レイアウトで表示する。
 *
 * @param props - セクション名、表示状態、および変更ハンドラー。
 * @returns 集計セクション用の表示設定。
 */
const RegisterScoreAggregateVisibilitySettings = (props: {
  label: string
  checked: boolean
  rowVisibility: RegisterScoreAggregateRowVisibility
  onChange: (checked: boolean) => void
  onRowVisibilityChange: (key: RegisterScoreAggregateRowKey, checked: boolean) => void
}) => (
  <div class="flex flex-col items-start gap-2">
    <CheckboxField
      checked={props.checked}
      onChange={props.onChange}
      textVariant="large"
      label={props.label}
    />
    <div class="ml-7 flex flex-col items-start gap-2">
      <For each={REGISTER_SCORE_AGGREGATE_ROW_OPTIONS}>
        {(option) => (
          <CheckboxField
            checked={props.rowVisibility[option.key]}
            disabled={!props.checked}
            onChange={(checked) => props.onRowVisibilityChange(option.key, checked)}
            textVariant="large"
            label={option.label}
          />
        )}
      </For>
    </div>
  </div>
)

/**
 * 更新差分の楽曲カードに適用するソート設定を表示する。
 *
 * @param props - 楽曲カードのソート現在値と変更ハンドラー。
 * @returns 楽曲カードのソート設定UI。
 */
const RegisterScoreSortControls = (props: {
  primaryKey: RegisterScorePrimarySortKey
  primaryDirection: SortDirection
  onPrimaryKeyChange: (key: RegisterScorePrimarySortKey) => void
  onPrimaryDirectionChange: (direction: SortDirection) => void
}) => {
  /**
   * 現在の主ソート設定に対応する選択肢を返す。
   *
   * @returns 主ソートの選択肢。
   */
  const primaryOption = () =>
    REGISTER_SCORE_PRIMARY_SORT_OPTIONS.find((option) => option.value === props.primaryKey) ??
    REGISTER_SCORE_PRIMARY_SORT_OPTIONS[0]

  /**
   * 現在のソート方向に対応する選択肢を返す。
   *
   * @param direction - 選択中のソート方向。
   * @returns ソート方向の選択肢。
   */
  const getDirectionOption = (direction: SortDirection): RegisterScoreSortDirectionOption =>
    REGISTER_SCORE_SORT_DIRECTION_OPTIONS.find((option) => option.value === direction) ??
    REGISTER_SCORE_SORT_DIRECTION_OPTIONS[0]

  return (
    <div class="w-full">
      <p class="mb-1 text-sm font-medium text-text-muted">{REGISTER_SCORE_COPY.songSortTitle}</p>
      <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_6rem] items-start gap-2">
        <AppSelect
          options={REGISTER_SCORE_PRIMARY_SORT_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={primaryOption()}
          onChange={(option) => {
            if (option) props.onPrimaryKeyChange(option.value)
          }}
          label={REGISTER_SCORE_COPY.songSortTitle}
          labelVariant="srOnly"
          formatLabel={(option) => option.label}
        />
        <AppSelect
          options={REGISTER_SCORE_SORT_DIRECTION_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={getDirectionOption(props.primaryDirection)}
          onChange={(option) => {
            if (option) props.onPrimaryDirectionChange(option.value)
          }}
          label={REGISTER_SCORE_COPY.songSortDirectionLabel}
          labelVariant="srOnly"
          formatLabel={(option) => option.label}
          disabled={props.primaryKey === 'none'}
        />
      </div>
    </div>
  )
}

/**
 * 更新差分レポートに含める集計セクションと統計行を選択する設定を表示する。
 *
 * 画像化対象外の画面専用UIであり、更新差分レポートの原寸DOMには含めない。
 *
 * @param props - 楽曲カードのソート、各集計セクション、統計行の表示状態、および変更ハンドラー。
 * @returns 更新差分の表示設定。
 */
export const RegisterScoreDisplaySettings = (props: {
  primarySortKey: RegisterScorePrimarySortKey
  primarySortDirection: SortDirection
  hideLampOnlyChanges: boolean
  showClassEmblem: boolean
  showTotalHighScore: boolean
  showRecordStatistics: boolean
  totalHighScoreRowVisibility: RegisterScoreAggregateRowVisibility
  statisticRowVisibility: RegisterScoreAggregateRowVisibility
  onPrimarySortKeyChange: (key: RegisterScorePrimarySortKey) => void
  onPrimarySortDirectionChange: (direction: SortDirection) => void
  onHideLampOnlyChangesChange: (checked: boolean) => void
  onShowClassEmblemChange: (checked: boolean) => void
  onShowTotalHighScoreChange: (checked: boolean) => void
  onShowRecordStatisticsChange: (checked: boolean) => void
  onTotalHighScoreRowVisibilityChange: (key: RegisterScoreAggregateRowKey, checked: boolean) => void
  onStatisticRowVisibilityChange: (key: RegisterScoreAggregateRowKey, checked: boolean) => void
}) => (
  <fieldset
    class="w-full min-w-0 rounded-md border border-border bg-surface p-4"
    aria-labelledby="register-score-display-settings-title"
  >
    <h2 id="register-score-display-settings-title" class="mb-3 text-lg font-semibold text-text">
      {REGISTER_SCORE_COPY.displaySettingsTitle}
    </h2>
    <div class="flex flex-col items-start gap-3">
      <RegisterScoreSortControls
        primaryKey={props.primarySortKey}
        primaryDirection={props.primarySortDirection}
        onPrimaryKeyChange={props.onPrimarySortKeyChange}
        onPrimaryDirectionChange={props.onPrimarySortDirectionChange}
      />
      <CheckboxField
        checked={props.hideLampOnlyChanges}
        onChange={props.onHideLampOnlyChangesChange}
        textVariant="large"
        label={REGISTER_SCORE_COPY.hideLampOnlyChanges}
      />
      <CheckboxField
        checked={props.showClassEmblem}
        onChange={props.onShowClassEmblemChange}
        textVariant="large"
        label={REGISTER_SCORE_COPY.showClassEmblem}
      />
      <RegisterScoreAggregateVisibilitySettings
        label={REGISTER_SCORE_COPY.totalHighScoreTitle}
        checked={props.showTotalHighScore}
        rowVisibility={props.totalHighScoreRowVisibility}
        onChange={props.onShowTotalHighScoreChange}
        onRowVisibilityChange={props.onTotalHighScoreRowVisibilityChange}
      />
      <RegisterScoreAggregateVisibilitySettings
        label={REGISTER_SCORE_COPY.recordStatsTitle}
        checked={props.showRecordStatistics}
        rowVisibility={props.statisticRowVisibility}
        onChange={props.onShowRecordStatisticsChange}
        onRowVisibilityChange={props.onStatisticRowVisibilityChange}
      />
    </div>
  </fieldset>
)
