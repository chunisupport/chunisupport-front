import { Show } from 'solid-js'
import { Loading } from '../../../../components'
import { AppSelect } from '../../../../components/common/AppSelect'
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

/**
 * 難易度別の楽曲統計を表示します。
 *
 * @param props - 表示対象の難易度一覧、統計情報、自己スコア、読み込み状態、難易度選択設定。
 * @returns 難易度選択欄と統計テーブル。
 */
const SongStatsTabs = (props: Props) => {
  const selectedDifficulty = () =>
    props.readonlyDifficulty !== undefined ? props.readonlyDifficulty : props.selectedDifficulty
  const selectedDifficultyOption = () =>
    props.difficulties.find((difficulty) => difficulty.value === selectedDifficulty()) ?? null

  /**
   * 選択された難易度を親へ通知する。
   *
   * @param option - 選択された難易度。
   * @returns なし。
   */
  const handleDifficultyChange = (option: DifficultyOption | null): void => {
    if (option && props.onDifficultyChange) {
      props.onDifficultyChange(option.value)
    }
  }

  return (
    <div class="space-y-3 rounded-md border border-border bg-surface p-4">
      <h2 class="text-lg font-semibold">難易度別統計</h2>
      <Show when={props.readonlyDifficulty === undefined}>
        <div class="w-44 max-w-full">
          <AppSelect<DifficultyOption>
            options={props.difficulties}
            optionValue="value"
            optionTextValue="label"
            value={selectedDifficultyOption()}
            onChange={handleDifficultyChange}
            label="難易度"
            labelVariant="srOnly"
            triggerClass="font-medium text-text-muted"
            contentZIndexClass="z-50"
            formatLabel={(difficulty) => difficulty.label}
          />
        </div>
      </Show>

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
    </div>
  )
}

export default SongStatsTabs
