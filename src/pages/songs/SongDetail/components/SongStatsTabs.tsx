import { createMemo, createSignal, Show } from 'solid-js'
import { Loading } from '../../../../components'
import { AppSelect } from '../../../../components/common/AppSelect'
import type { RatingBandDTO, SongStatsResponseDTO } from '../../../../types/api'
import SongStatsTable, {
  type SongStatsTableView,
  type SongStatsTableViewOption,
  TABLE_VIEW_OPTIONS,
} from './SongStatsTable'

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

/** 難易度別統計の補足説明文 */
const SONG_STATS_DESCRIPTION =
  '実力帯(ベスト枠平均)ごとに集計されます。データは1日に2回更新されます。'

/** 難易度別統計のSelect群を横並びにするコンテナクラス */
const STATS_CONTROL_ROW_CLASS = 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center'

/** 難易度別統計の各Select幅を揃えるラッパークラス */
const STATS_CONTROL_ITEM_CLASS = 'min-w-0 sm:w-44'

/** 統計テーブル再取得中に表示するオーバーレイのクラス */
const STATS_LOADING_OVERLAY_CLASS =
  'absolute inset-0 z-10 flex items-center justify-center rounded bg-surface/70'

/**
 * 難易度別の楽曲統計を表示します。
 *
 * @param props - 表示対象の難易度一覧、統計情報、自己スコア、読み込み状態、難易度選択設定。
 * @returns 難易度選択ドロップダウンと統計テーブル。
 */
const SongStatsTabs = (props: Props) => {
  const [selectedTableView, setSelectedTableView] = createSignal<SongStatsTableView>('averageScore')
  const selectedDifficulty = () =>
    props.readonlyDifficulty !== undefined ? props.readonlyDifficulty : props.selectedDifficulty
  const selectedDifficultyOption = () =>
    props.difficulties.find((difficulty) => difficulty.value === selectedDifficulty()) ??
    props.difficulties[0]
  const selectedTableViewOption = createMemo(
    () =>
      TABLE_VIEW_OPTIONS.find((option) => option.value === selectedTableView()) ??
      TABLE_VIEW_OPTIONS[0]
  )

  /**
   * 難易度Selectの変更結果を親コンポーネントへ反映します。
   *
   * @param option - 選択された難易度。選択解除時はnull。
   * @returns なし。
   */
  const handleDifficultyChange = (option: DifficultyOption | null): void => {
    if (option && props.onDifficultyChange) props.onDifficultyChange(option.value)
  }

  /**
   * 統計テーブルの表示内容を更新します。
   *
   * @param option - 選択された表示内容。選択解除時はnull。
   * @returns なし。
   */
  const handleTableViewChange = (option: SongStatsTableViewOption | null): void => {
    if (option) setSelectedTableView(option.value)
  }

  return (
    <div class="space-y-3 rounded-md border border-border bg-surface p-4">
      <div class="space-y-1">
        <h2 class="text-lg font-semibold">難易度別統計</h2>
        <p class="text-xs text-text-muted">{SONG_STATS_DESCRIPTION}</p>
      </div>

      <div class={STATS_CONTROL_ROW_CLASS}>
        <Show when={props.readonlyDifficulty === undefined}>
          <div class={STATS_CONTROL_ITEM_CLASS}>
            <AppSelect<DifficultyOption>
              options={props.difficulties}
              optionValue="value"
              optionTextValue="label"
              value={selectedDifficultyOption()}
              onChange={handleDifficultyChange}
              label="統計に表示する難易度"
              labelVariant="srOnly"
              triggerClass="h-10 text-text-muted"
              contentZIndexClass="z-50"
              formatLabel={(difficulty) => difficulty.label}
            />
          </div>
        </Show>

        <div
          class={`${STATS_CONTROL_ITEM_CLASS} ${
            props.readonlyDifficulty === undefined ? '' : 'col-span-2'
          }`}
        >
          <AppSelect<SongStatsTableViewOption>
            options={TABLE_VIEW_OPTIONS}
            optionValue="value"
            optionTextValue="label"
            value={selectedTableViewOption()}
            onChange={handleTableViewChange}
            label="統計テーブルの表示内容"
            labelVariant="srOnly"
            triggerClass="h-10 text-text-muted"
            contentZIndexClass="z-50"
            formatLabel={(option) => option.label}
          />
        </div>
      </div>

      <div class="mt-3">
        <Show when={props.stats} fallback={<Loading />}>
          {(statsData) => (
            <div class="relative">
              <Show when={props.isStatsLoading}>
                <div class={STATS_LOADING_OVERLAY_CLASS}>
                  <Loading />
                </div>
              </Show>
              <SongStatsTable
                stats={statsData().stats}
                selectedView={selectedTableView()}
                bestAverage={props.bestAverage}
                ratingBands={props.ratingBands}
                ownScore={props.ownScore}
              />
            </div>
          )}
        </Show>
      </div>
    </div>
  )
}

export default SongStatsTabs
