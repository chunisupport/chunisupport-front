import { A } from '@solidjs/router'
import { ChevronRight } from 'lucide-solid'
import { For, Show } from 'solid-js'
import { Loading } from '../../../../components/index.ts'
import { DifficultyBadge } from '../../../../components/common/DifficultyBadge.tsx'
import { buildSongScoreHistoryPath } from '../../../../constants/routes.ts'
import type { PlayerDataDifficulty } from '../../../../types/api.ts'
import {
  OWN_SCORE_CARD_TITLE,
  SCORE_HISTORY_LINK_LABEL,
  UNPLAYED_SCORE_LABEL,
} from '../scoreHistory.constants.ts'

export type OwnScoreItem = {
  difficulty: PlayerDataDifficulty
  score?: number
  supportsHistory: boolean
}

/**
 * ログインユーザーの譜面別ベストスコアを表示する。
 *
 * @param props - 楽曲ID、譜面別スコア、読み込み状態。
 * @returns 譜面別の自己スコアカード。
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
                  when={item.score !== undefined}
                  fallback={
                    <div class={cardClass}>
                      <DifficultyBadge difficulty={item.difficulty} />
                      <span class="ml-auto text-sm text-text-muted">{UNPLAYED_SCORE_LABEL}</span>
                    </div>
                  }
                >
                  <Show
                    when={item.supportsHistory}
                    fallback={
                      <div class={cardClass}>
                        <DifficultyBadge difficulty={item.difficulty} />
                        <span class="ml-auto font-oswald text-lg font-semibold tabular-nums">
                          {item.score?.toLocaleString('ja-JP')}
                        </span>
                      </div>
                    }
                  >
                    <A
                      href={buildSongScoreHistoryPath(props.displayId, item.difficulty)}
                      class={`${cardClass} group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
                      aria-label={`${item.difficulty} ${item.score?.toLocaleString('ja-JP')} ${SCORE_HISTORY_LINK_LABEL}`}
                    >
                      <DifficultyBadge difficulty={item.difficulty} />
                      <span class="ml-auto flex items-center gap-2">
                        <span class="font-oswald text-lg font-semibold tabular-nums">
                          {item.score?.toLocaleString('ja-JP')}
                        </span>
                        <ChevronRight
                          class="h-4 w-4 text-action-primary transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </A>
                  </Show>
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
