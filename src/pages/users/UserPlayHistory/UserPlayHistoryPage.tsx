import { A, useParams } from '@solidjs/router'
import { createQuery } from '@tanstack/solid-query'
import ArrowLeft from 'lucide-solid/icons/arrow-left'
import { For, Show } from 'solid-js'
import { LoadError, Loading } from '../../../components'
import { CourseChartDifficultyBadge } from '../../../components/common/course/CourseChartDifficultyBadge'
import { DefaultRecordLampBadges } from '../../../components/common/record/RecordDisplayParts'
import { PLAY_HISTORY_LABEL } from '../../../constants/playHistory'
import { useDocumentTitle } from '../../../hooks/useDocumentTitle'
import { playHistoryQueryOptions } from '../../../queries/playHistory'
import { authSession } from '../../../stores/authSession'
import { formatJstDateTimeMinute } from '../../../utils/jstDateTime'
import { buildUserProfilePagePath } from '../../../utils/userProfileRoute'
import { PLAY_HISTORY_COPY } from './constants'

/**
 * 表示中のユーザーの直近のプレイを、レコードと同じランプ表示で並べる。
 *
 * @returns 表示中のユーザーのプレイ履歴ページ。
 */
const UserPlayHistoryPage = () => {
  const params = useParams<{ username: string }>()
  const history = createQuery(() =>
    playHistoryQueryOptions(authSession.user?.username ?? null, params.username)
  )
  useDocumentTitle(() => `${params.username} | ${PLAY_HISTORY_LABEL}`)

  return (
    <div class="mx-auto w-full max-w-3xl space-y-4 p-4">
      <A
        href={buildUserProfilePagePath(params.username, 'record_normal')}
        class="inline-flex items-center gap-1 rounded text-sm text-action-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <ArrowLeft class="size-4" aria-hidden="true" />
        {PLAY_HISTORY_COPY.backToRecords}
      </A>
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold text-text">{PLAY_HISTORY_LABEL}</h1>
        <p class="font-sans text-sm text-text-muted">{params.username}</p>
      </header>
      <Show when={!history.isError} fallback={<LoadError error={history.error} />}>
        <Show when={!history.isPending} fallback={<Loading />}>
          <Show
            when={history.data?.entries.length}
            fallback={<p class="py-4 text-sm text-text-muted">{PLAY_HISTORY_COPY.empty}</p>}
          >
            <table class="w-full border-collapse bg-surface">
              <thead class="bg-surface-muted text-xs text-text-muted">
                <tr>
                  <th scope="col" class="px-1 py-2 text-left">
                    {PLAY_HISTORY_COPY.song}
                  </th>
                  <th scope="col" class="px-1 py-2 text-right">
                    {PLAY_HISTORY_COPY.score}
                  </th>
                  <th scope="col" class="px-1 py-2 text-center">
                    {PLAY_HISTORY_COPY.lamps}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <For each={history.data?.entries}>
                  {(entry) => (
                    <tr>
                      <td class="space-y-1 px-1 py-2 text-sm">
                        <div class="font-sans wrap-anywhere">
                          {entry.title ?? PLAY_HISTORY_COPY.unknownTitle}
                        </div>
                        <Show when={entry.difficulty}>
                          {(difficulty) => <CourseChartDifficultyBadge difficulty={difficulty()} />}
                        </Show>
                        <time class="block text-xs text-text-muted" datetime={entry.played_at}>
                          {formatJstDateTimeMinute(entry.played_at) ??
                            PLAY_HISTORY_COPY.unknownTime}
                        </time>
                      </td>
                      <td class="px-1 py-2 text-right font-jost text-sm font-semibold whitespace-nowrap tabular-nums">
                        {entry.score.toLocaleString('ja-JP')}
                      </td>
                      <td class="px-1 py-2">
                        <DefaultRecordLampBadges record={entry} class="justify-center" />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </Show>
      </Show>
    </div>
  )
}

export default UserPlayHistoryPage
