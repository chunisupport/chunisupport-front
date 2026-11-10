import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import { AppSelect } from '../../../components/common/AppSelect'
import ChartConstRangeField from '../../../components/common/ChartConstRangeField'
import {
  GenreMultiSelect,
  NameFolderFilterMultiSelect,
  VersionMultiSelect,
} from '../../../components/common/DomainMultiSelect'
import {
  type ChartConstRangeSelection,
  createChartConstRangeDraft,
} from '../../../hooks/createChartConstRangeDraft'
import type { NameFolderDTO } from '../../../types/api'
import {
  toNullableAllDisplaySelection,
  toNullableAllFilterSelection,
} from '../../../utils/filterSelection'
import type {
  PlayerStatsAttributeSelection,
  PlayerStatsDifficulty,
} from '../../../utils/playerStatsDashboard'
import {
  PLAYER_STATS_COPY,
  PLAYER_STATS_DIFFICULTY_OPTIONS,
  PLAYER_STATS_FILTER_ID_PREFIX,
  type PlayerStatsDifficultyOption,
} from './constants'

/** 統計ダッシュボードへ適用する集計対象フィルター。ジャンル・バージョン・楽曲名順の null は全選択を表す */
export type PlayerStatsFilterState = ChartConstRangeSelection &
  PlayerStatsAttributeSelection & {
    difficulty: PlayerStatsDifficulty
  }

type PlayerStatsFilterDialogProps = {
  open: boolean
  filters: PlayerStatsFilterState
  /** 表示順に並べたジャンル名 */
  genreOptions: readonly string[]
  /** 稼働順に並べた公開済みバージョンの短縮名 */
  versionOptions: readonly string[]
  /** 楽曲名順フォルダ一覧（表示順） */
  nameFolders: readonly NameFolderDTO[]
  onOpenChange: (open: boolean) => void
  onApply: (filters: PlayerStatsFilterState) => void
}

/** ダイアログより前面に Select の選択肢を表示するクラス */
const FILTER_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'

/**
 * ダッシュボードの難易度・レベル/譜面定数・ジャンル・バージョン・楽曲名順を編集するダイアログを表示する。
 *
 * @param props - 開閉状態、適用済み条件、選択肢、変更通知。
 * @returns 適用まで編集内容を保持するフィルターダイアログ。
 */
export const PlayerStatsFilterDialog: Component<PlayerStatsFilterDialogProps> = (props) => {
  const [draft, setDraft] = createSignal<PlayerStatsFilterState>({ ...props.filters })
  const selectedDifficultyOption = createMemo(
    () =>
      PLAYER_STATS_DIFFICULTY_OPTIONS.find((option) => option.value === draft().difficulty) ??
      PLAYER_STATS_DIFFICULTY_OPTIONS[0]
  )
  const constRangeDraft = createChartConstRangeDraft({
    get: () => draft(),
    set: (next) => setDraft((current) => ({ ...current, ...next })),
  })

  createEffect(() => {
    if (props.open) {
      setDraft({ ...props.filters })
      constRangeDraft.sync(props.filters.constRange)
    }
  })

  /**
   * 編集中の条件を適用し、ダイアログを閉じる。
   *
   * @returns なし。
   */
  const handleApply = (): void => {
    props.onApply(draft())
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex h-160 max-h-[calc(100dvh-2rem)] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="shrink-0 text-lg font-bold text-text">
            {PLAYER_STATS_COPY.filterTitle}
          </Dialog.Title>
          <div class="mt-4 min-h-0 flex-1 basis-0 space-y-5 overflow-y-auto">
            <AppSelect<PlayerStatsDifficultyOption>
              options={PLAYER_STATS_DIFFICULTY_OPTIONS}
              optionValue="value"
              optionTextValue="label"
              value={selectedDifficultyOption()}
              onChange={(option) =>
                option && setDraft((current) => ({ ...current, difficulty: option.value }))
              }
              label={PLAYER_STATS_COPY.difficultyLabel}
              formatLabel={(option) => option.label}
              contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
            />
            <ChartConstRangeField
              idPrefix={PLAYER_STATS_FILTER_ID_PREFIX}
              {...constRangeDraft.fieldProps}
            />
            <GenreMultiSelect
              labelClass="text-text"
              options={toMultiSelectOptions(props.genreOptions)}
              selected={toNullableAllDisplaySelection(draft().genres, props.genreOptions)}
              contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
              onChange={(selected) =>
                setDraft((current) => ({
                  ...current,
                  genres: toNullableAllFilterSelection(selected, props.genreOptions),
                }))
              }
            />
            <VersionMultiSelect
              labelClass="text-text"
              options={toMultiSelectOptions(props.versionOptions)}
              selected={toNullableAllDisplaySelection(draft().versions, props.versionOptions)}
              contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
              onChange={(selected) =>
                setDraft((current) => ({
                  ...current,
                  versions: toNullableAllFilterSelection(selected, props.versionOptions),
                }))
              }
            />
            <NameFolderFilterMultiSelect
              labelClass="text-text"
              nameFolders={props.nameFolders}
              selected={draft().nameFolders}
              contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
              onChange={(nameFolders) => setDraft((current) => ({ ...current, nameFolders }))}
            />
          </div>
          <div class="mt-6 flex shrink-0 justify-end gap-2">
            <AppButton onClick={() => props.onOpenChange(false)}>
              {PLAYER_STATS_COPY.cancel}
            </AppButton>
            <AppButton variant="primary" onClick={handleApply}>
              {PLAYER_STATS_COPY.apply}
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
