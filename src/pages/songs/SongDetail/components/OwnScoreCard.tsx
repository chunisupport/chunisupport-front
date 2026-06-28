import { A } from '@solidjs/router'
import { ChevronRight } from 'lucide-solid'
import { For, Show } from 'solid-js'
import type { ScoreHistoryDifficulty } from '../../../../api/songs'
import { Loading } from '../../../../components'
import { DifficultyBadge } from '../../../../components/common/DifficultyBadge'
import { buildSongScoreHistoryPath } from '../../../../constants/routes'
import type { ScoreHistoryEntryDTO } from '../../../../types/api'
import {
  OWN_SCORE_CARD_TITLE,
  SCORE_HISTORY_LINK_LABEL,
  UNPLAYED_SCORE_LABEL,
} from '../scoreHistory.constants'

export type OwnScoreItem = {
  difficulty: ScoreHistoryDifficulty
  entry?: ScoreHistoryEntryDTO
}

/**
 * ログインユーザーの譜面別ベストスコアを表示する。
 *
 * @param props - 楽曲ID、譜面別スコア、読み込み状態。
 * @returns スコア履歴へのリンクを含むカード。
 */
const OwnScoreCard = (props: {
  displayId: string
  items: readonly OwnScoreItem[]
  loading: boolean
}) => (
  <section>
    <h2 class="mb-3 text-lg font-semibold">{OWN_SCORE_CARD_TITLE}</h2>
    <Show when={!props.loading} fallback={<Loading />}>
      <ul class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <For each={props.items}>
          {(item) => {
            const cardClass =
              'flex min-h-20 items-center gap-3 rounded-lg border border-border bg-surface p-4'

            return (
              <li>
                <Show
                  when={item.entry}
                  fallback={
                    <div class={cardClass}>
                      <DifficultyBadge difficulty={item.difficulty} />
                      <span class="ml-auto text-sm text-text-muted">{UNPLAYED_SCORE_LABEL}</span>
                    </div>
                  }
                >
                  {(entry) => (
                    <A
                      href={buildSongScoreHistoryPath(props.displayId, item.difficulty)}
                      class={`${cardClass} group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
                      aria-label={`${item.difficulty} ${entry().score.toLocaleString('ja-JP')} ${SCORE_HISTORY_LINK_LABEL}`}
                    >
                      <DifficultyBadge difficulty={item.difficulty} />
                      <span class="ml-auto flex items-center gap-2">
                        <span class="font-oswald text-lg font-semibold tabular-nums">
                          {entry().score.toLocaleString('ja-JP')}
                        </span>
                        <ChevronRight
                          class="h-4 w-4 text-action-primary transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </A>
                  )}
                </Show>
              </li>
            )
          }}
        </For>
      </ul>
    </Show>
  </section>
)

export default OwnScoreCard
