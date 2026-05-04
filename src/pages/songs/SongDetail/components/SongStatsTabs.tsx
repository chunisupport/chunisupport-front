import * as Tabs from '@kobalte/core/tabs'
import { For, Show } from 'solid-js'
import type { SongStatsResponseDTO } from '../../../../types/api'
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
} & (SelectableDifficultyProps | ReadonlyDifficultyProps)

const SongStatsTabs = (props: Props) => {
  const selectedDifficulty = () =>
    props.readonlyDifficulty !== undefined ? props.readonlyDifficulty : props.selectedDifficulty

  return (
    <div class="space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <h2 class="text-lg font-semibold">難易度別統計</h2>

      <Tabs.Root value={selectedDifficulty()} onChange={props.onDifficultyChange}>
        <Show when={props.readonlyDifficulty === undefined}>
          <Tabs.List class="flex flex-wrap gap-2">
            <For each={props.difficulties}>
              {(difficulty) => (
                <Tabs.Trigger
                  value={difficulty.value}
                  class="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 data-selected:border-primary-600 data-selected:bg-primary-50 data-selected:text-primary-700"
                >
                  {difficulty.label}
                </Tabs.Trigger>
              )}
            </For>
          </Tabs.List>
        </Show>

        <For each={props.difficulties}>
          {(difficulty) => (
            <Tabs.Content value={difficulty.value} class="mt-3">
              <Show
                when={!props.isStatsLoading && props.stats}
                fallback={<p class="text-sm text-gray-500">統計を読み込み中...</p>}
              >
                {(statsData) => <SongStatsTable stats={statsData().stats} />}
              </Show>
            </Tabs.Content>
          )}
        </For>
      </Tabs.Root>
    </div>
  )
}

export default SongStatsTabs
