import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { MultiSelectField, toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import { AppSelect } from '../../../components/common/AppSelect'
import type { PlayerStatsDifficulty } from '../../../utils/playerStatsDashboard'
import {
  PLAYER_STATS_COPY,
  PLAYER_STATS_DIFFICULTY_OPTIONS,
  type PlayerStatsDifficultyOption,
} from './constants'

/** 統計ダッシュボードへ適用する集計対象フィルター */
export type PlayerStatsFilterState = {
  difficulty: PlayerStatsDifficulty
  genres: string[]
  versions: string[]
}

type PlayerStatsFilterDialogProps = {
  open: boolean
  filters: PlayerStatsFilterState
  genreOptions: readonly string[]
  versionOptions: readonly string[]
  onOpenChange: (open: boolean) => void
  onApply: (filters: PlayerStatsFilterState) => void
}

/** ダイアログより前面に Select の選択肢を表示するクラス */
const FILTER_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'

/**
 * ダッシュボードの難易度・ジャンル・バージョンを編集するダイアログを表示する。
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

  createEffect(() => {
    if (props.open) {
      setDraft({
        difficulty: props.filters.difficulty,
        genres: [...props.filters.genres],
        versions: [...props.filters.versions],
      })
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
            <MultiSelectField
              label={PLAYER_STATS_COPY.genreLabel}
              labelClass="text-text"
              options={toMultiSelectOptions(props.genreOptions)}
              selected={draft().genres}
              placeholder={PLAYER_STATS_COPY.genrePlaceholder}
              contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
              onChange={(genres) => setDraft((current) => ({ ...current, genres }))}
            />
            <MultiSelectField
              label={PLAYER_STATS_COPY.versionLabel}
              labelClass="text-text"
              options={toMultiSelectOptions(props.versionOptions)}
              selected={draft().versions}
              placeholder={PLAYER_STATS_COPY.versionPlaceholder}
              contentZIndexClass={FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
              onChange={(versions) => setDraft((current) => ({ ...current, versions }))}
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
