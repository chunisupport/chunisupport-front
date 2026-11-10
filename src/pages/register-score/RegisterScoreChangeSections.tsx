import { For, Show } from 'solid-js'
import type {
  PlayerDataCourseRecordChange,
  PlayerDataRecordChange,
  PlayerDataSongRecordChange,
} from '../../types/api'
import { REGISTER_SCORE_COPY } from './constants'
import {
  RegisterScoreCourseChangeCard,
  RegisterScoreSongChangeCard,
} from './RegisterScoreChangeCards'
import type {
  RegisterScoreChartLevelResolver,
  RegisterScoreCourseTitleResolver,
  RegisterScoreSongMetricsResolver,
  RegisterScoreSongTitleResolver,
} from './registerScoreResolvers'

/** 更新差分セクションに共通する画像除外の表示状態と変更ハンドラー */
type RegisterScoreChangesSectionImageProps = {
  /** セクション内のカードがすべて画像から除外されているか */
  excludedFromImage: boolean
  /** 更新差分を画像から除外しているか判定する関数 */
  isChangeExcludedFromImage: (change: PlayerDataRecordChange) => boolean
  /** 更新差分の画像除外状態を変更する関数 */
  onChangeExcludedFromImage: (change: PlayerDataRecordChange, excluded: boolean) => void
}

/**
 * 更新された楽曲レコードの一覧を表示する。
 *
 * 画像化処理は `data-score-image-section` の先頭要素を見出し、`data-score-image-cards` の子要素をカードとして分割する。
 *
 * @param props - 表示対象の楽曲差分、表示値の解決関数、空状態文言、画像除外状態と変更ハンドラー。
 * @returns NEW RECORDSセクション。
 */
export const RegisterScoreSongChangesSection = (
  props: RegisterScoreChangesSectionImageProps & {
    changes: PlayerDataSongRecordChange[]
    resolveSongTitle: RegisterScoreSongTitleResolver
    resolveChartLevel?: RegisterScoreChartLevelResolver
    resolveSongMetrics: RegisterScoreSongMetricsResolver
    emptyMessage?: string
  }
) => (
  <section
    class="min-w-0 pt-4"
    data-score-image-section
    data-image-capture-excluded={props.excludedFromImage ? 'true' : undefined}
  >
    <h2 class="mb-1 whitespace-nowrap text-xl font-bold">
      {REGISTER_SCORE_COPY.changedSongsTitle}
    </h2>
    <Show
      when={props.changes.length > 0}
      fallback={
        <p class="px-2 py-6 text-center text-sm text-text-muted">
          {props.emptyMessage ?? REGISTER_SCORE_COPY.changedSongsEmpty}
        </p>
      }
    >
      <div class="mt-2 grid min-w-0 max-w-full gap-2" data-score-image-cards>
        <For each={props.changes}>
          {(change) => (
            <RegisterScoreSongChangeCard
              change={change}
              songTitle={props.resolveSongTitle(change)}
              chartLevel={props.resolveChartLevel?.(change)}
              metrics={props.resolveSongMetrics(change)}
              excludedFromImage={props.isChangeExcludedFromImage(change)}
              onExcludedFromImageChange={(excluded) =>
                props.onChangeExcludedFromImage(change, excluded)
              }
            />
          )}
        </For>
      </div>
    </Show>
  </section>
)

/**
 * 更新されたコースレコードをレポート末尾へ表示する。
 *
 * @param props - 表示対象のコース差分、コースタイトルの解決関数、画像除外状態と変更ハンドラー。
 * @returns COURSE RECORDSセクション。差分がない場合は何も表示しない。
 */
export const RegisterScoreCourseChangesSection = (
  props: RegisterScoreChangesSectionImageProps & {
    changes: PlayerDataCourseRecordChange[]
    resolveCourseTitle: RegisterScoreCourseTitleResolver
  }
) => (
  <Show when={props.changes.length > 0}>
    <section
      class="min-w-0 pt-4"
      data-score-image-section
      data-image-capture-excluded={props.excludedFromImage ? 'true' : undefined}
    >
      <h2 class="mb-1 whitespace-nowrap text-xl font-bold">
        {REGISTER_SCORE_COPY.changedCoursesTitle}
      </h2>
      <div class="mt-2 grid min-w-0 max-w-full gap-2" data-score-image-cards>
        <For each={props.changes}>
          {(change) => (
            <RegisterScoreCourseChangeCard
              change={change}
              courseTitle={props.resolveCourseTitle(change)}
              excludedFromImage={props.isChangeExcludedFromImage(change)}
              onExcludedFromImageChange={(excluded) =>
                props.onChangeExcludedFromImage(change, excluded)
              }
            />
          )}
        </For>
      </div>
    </section>
  </Show>
)
