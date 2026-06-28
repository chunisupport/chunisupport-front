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
  <section class="rounded-lg border border-border bg-surface p-4">
    <h2 class="mb-3 text-lg font-semibold">{OWN_SCORE_CARD_TITLE}</h2>
    <Show when={!props.loading} fallback={<Loading />}>
      <ul class="divide-y divide-border">
        <For each={props.items}>
          {(item) => (
            <li>
              <Show
                when={item.entry}
                fallback={
                  <div class="flex min-h-14 items-center gap-3 py-2">
                    <DifficultyBadge difficulty={item.difficulty} />
                    <span class="ml-auto text-sm text-text-muted">{UNPLAYED_SCORE_LABEL}</span>
                  </div>
                }
              >
                {(entry) => (
                  <A
                    href={buildSongScoreHistoryPath(props.displayId, item.difficulty)}
                    class="group flex min-h-14 items-center gap-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    aria-label={`${item.difficulty} ${entry().score.toLocaleString('ja-JP')} ${SCORE_HISTORY_LINK_LABEL}`}
                  >
                    <DifficultyBadge difficulty={item.difficulty} />
                    <span class="ml-auto font-oswald text-lg font-semibold tabular-nums">
                      {entry().score.toLocaleString('ja-JP')}
                    </span>
                    <span class="hidden text-sm text-action-primary sm:inline">
                      {SCORE_HISTORY_LINK_LABEL}
                    </span>
                    <ChevronRight
                      class="h-4 w-4 text-action-primary transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </A>
                )}
              </Show>
            </li>
          )}
        </For>
      </ul>
    </Show>
  </section>
)

export default OwnScoreCard
