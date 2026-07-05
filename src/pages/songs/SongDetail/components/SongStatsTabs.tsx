import { Select } from '@kobalte/core/select'
import * as Tabs from '@kobalte/core/tabs'
import { ChevronDown } from 'lucide-solid'
import { For, Show } from 'solid-js'
import { Loading } from '../../../../components'
import type { RatingBandDTO, SongStatsResponseDTO } from '../../../../types/api'
import SongStatsTable from './SongStatsTable'

type DifficultyOption = {
  label: string
  value: string
}

type SelectableDifficultyProps = {
  selectedDifficulty: string
  onDifficultyChange: (difficulty: string) => void
  readonlyDifficulty?: never
}

type ReadonlyDifficultyProps = {
  selectedDifficulty?: never
  onDifficultyChange?: never
  readonlyDifficulty: string
}

type Props = {
  difficulties: DifficultyOption[]
  stats: SongStatsResponseDTO | undefined
  isStatsLoading: boolean
  bestAverage?: number | null
  ratingBands?: RatingBandDTO[]
  ownScore?: number
} & (SelectableDifficultyProps | ReadonlyDifficultyProps)

/** 難易度別統計の補足説明文。 */
const SONG_STATS_DESCRIPTION =
  '実力帯(ベスト枠平均)ごとに集計されます。データは1日に2回更新されます。'

/** 難易度選択Selectのトリガーに適用するTailwindクラス。 */
const DIFFICULTY_SELECT_TRIGGER_CLASS =
  'grid h-10 w-full grid-cols-[1fr_auto] items-center gap-2 rounded border border-border-strong bg-surface px-3 text-left text-sm text-text-muted hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60 sm:w-44'

/** 難易度選択Selectの選択肢に適用するTailwindクラス。 */
const DIFFICULTY_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-sm text-text hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'

/** 難易度選択Selectのポータルに適用するTailwindクラス。 */
const DIFFICULTY_SELECT_CONTENT_CLASS =
  'z-40 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md'

/**
 * 難易度別の楽曲統計タブを表示します。
 *
 * @param props - 表示対象の難易度一覧、統計情報、自己スコア、読み込み状態、難易度選択設定。
 * @returns 難易度選択ドロップダウンと統計テーブル。
 */
const SongStatsTabs = (props: Props) => {
  const selectedDifficulty = () =>
    props.readonlyDifficulty !== undefined ? props.readonlyDifficulty : props.selectedDifficulty
  const selectedDifficultyOption = () =>
    props.difficulties.find((difficulty) => difficulty.value === selectedDifficulty()) ??
    props.difficulties[0]

  /**
   * 難易度Selectの変更結果を親コンポーネントへ反映します。
   *
   * @param option - 選択された難易度。選択解除時はnull。
   * @returns なし。
   */
  const handleDifficultyChange = (option: DifficultyOption | null): void => {
    if (option && props.onDifficultyChange) props.onDifficultyChange(option.value)
  }

  return (
    <div class="space-y-3 rounded-md border border-border bg-surface p-4">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">難易度別統計</h2>
        <p class="text-xs text-text-muted">{SONG_STATS_DESCRIPTION}</p>
      </div>

      <Tabs.Root value={selectedDifficulty()}>
        <Show when={props.readonlyDifficulty === undefined}>
          <Select<DifficultyOption>
            options={props.difficulties}
            optionValue="value"
            optionTextValue="label"
            value={selectedDifficultyOption()}
            onChange={handleDifficultyChange}
            gutter={0}
            itemComponent={(itemProps) => (
              <Select.Item item={itemProps.item} class={DIFFICULTY_SELECT_ITEM_CLASS}>
                <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
              </Select.Item>
            )}
          >
            <Select.Label class="sr-only">統計に表示する難易度</Select.Label>
            <Select.Trigger class={DIFFICULTY_SELECT_TRIGGER_CLASS}>
              <Select.Value<DifficultyOption> class="truncate">
                {(state) => state.selectedOption()?.label}
              </Select.Value>
              <Select.Icon class="text-text-subtle">
                <ChevronDown size={16} aria-hidden="true" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class={DIFFICULTY_SELECT_CONTENT_CLASS}>
                <Select.Listbox />
              </Select.Content>
            </Select.Portal>
          </Select>
        </Show>

        <For each={props.difficulties}>
          {(difficulty) => (
            <Tabs.Content value={difficulty.value} class="mt-3">
              <Show when={!props.isStatsLoading && props.stats} fallback={<Loading />}>
                {(statsData) => (
                  <SongStatsTable
                    stats={statsData().stats}
                    bestAverage={props.bestAverage}
                    ratingBands={props.ratingBands}
                    ownScore={props.ownScore}
                  />
                )}
              </Show>
            </Tabs.Content>
          )}
        </For>
      </Tabs.Root>
    </div>
  )
}

export default SongStatsTabs
