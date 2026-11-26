import { Button } from '@kobalte/core/button'
import type { JSX } from 'solid-js'
import { createMemo, createResource, createSignal, Show } from 'solid-js'
import { LoadError, Loading } from '../../../../components'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import AdminRankingLink from '../../../../components/common/ranking/AdminRankingLink'
import FriendRankingSection from '../../../../components/common/ranking/FriendRankingSection'
import type { FriendRankingTableEntry } from '../../../../components/common/ranking/FriendRankingTable'
import { fetchVersions } from '../../../../queries/masterData'
import type { ScoreHistoryEntryDTO } from '../../../../types/api'
import {
  SCORE_HISTORY_MAX_ENTRIES_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
  SCORE_HISTORY_VERSION_LABEL_TOGGLE,
} from './constants'
import ScoreHistoryChart from './ScoreHistoryChart'
import ScoreHistoryTable from './ScoreHistoryTable'
import ScoreHistoryTableDialog from './ScoreHistoryTableDialog'

type Props = {
  /** 表示対象の楽曲名 */
  title: string
  /** 表示対象のアーティスト名 */
  artist: string
  /** 通常難易度または WORLD'S END を表すバッジ */
  badge: JSX.Element
  /** 楽曲詳細へ戻る操作 */
  onBack: () => void
  /** 表示対象のスコア履歴 */
  historyEntries: readonly ScoreHistoryEntryDTO[]
  /** スコア履歴を読み込み中か */
  isHistoryLoading: boolean
  /** スコア履歴の取得エラー */
  historyError: unknown
  /** 表示対象のフレンドランキング */
  friendRankingEntries: readonly FriendRankingTableEntry[]
  /** フレンドランキングを読み込み中か */
  isFriendRankingLoading: boolean
  /** フレンドランキングの取得エラー */
  friendRankingError: unknown
  /** ADMIN向け全体ランキング画面のパス */
  adminRankingHref: string
}

/**
 * 通常譜面と WORLD'S END で共通の譜面詳細を表示し、履歴の明細をダイアログで開く。
 *
 * @param props - 楽曲情報、履歴、ランキングと読み込み状態。
 * @returns スコア推移とフレンドランキングを含む譜面詳細画面。
 */
const ChartDetailPage = (props: Props) => {
  const [versions] = createResource(fetchVersions)
  const [showVersions, setShowVersions] = createSignal(true)
  const availableVersions = createMemo(() => (versions.error ? [] : (versions()?.versions ?? [])))

  return (
    <main class="mx-auto w-full max-w-5xl space-y-6 p-4">
      <Button
        type="button"
        onClick={props.onBack}
        class="cursor-pointer border-0 bg-transparent p-0 text-sm text-action-primary hover:underline"
      >
        ← 楽曲詳細へ戻る
      </Button>

      <header class="space-y-2">
        <h1 class="font-sans text-2xl font-semibold">{props.title}</h1>
        <div class="flex flex-wrap items-center gap-3 text-sm text-text-muted">
          {props.badge}
          <span class="font-sans">{props.artist}</span>
        </div>
      </header>

      <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="flex flex-wrap items-baseline gap-2 text-lg font-semibold">
            {SCORE_HISTORY_SECTION_LABEL}
            <span class="text-xs font-normal text-text-muted">
              {SCORE_HISTORY_MAX_ENTRIES_LABEL}
            </span>
          </h2>
          <Show
            when={!props.historyError && !props.isHistoryLoading && props.historyEntries.length > 0}
          >
            <ScoreHistoryTableDialog>
              <Show when={!versions.error}>
                <CheckboxField
                  id="score-history-version-label-toggle"
                  checked={showVersions()}
                  label={SCORE_HISTORY_VERSION_LABEL_TOGGLE}
                  disabled={versions.loading}
                  onChange={setShowVersions}
                  class="mb-3 w-fit"
                  inputClass="peer"
                  controlClass="peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-inset peer-focus-visible:ring-focus-ring"
                />
              </Show>
              <ScoreHistoryTable
                entries={props.historyEntries}
                versions={availableVersions()}
                showVersions={showVersions()}
              />
            </ScoreHistoryTableDialog>
          </Show>
        </div>
        <Show when={!props.historyError} fallback={<LoadError error={props.historyError} />}>
          <Show when={!props.isHistoryLoading} fallback={<Loading />}>
            <ScoreHistoryChart entries={props.historyEntries} />
          </Show>
        </Show>
      </section>

      <FriendRankingSection
        entries={props.friendRankingEntries}
        isLoading={props.isFriendRankingLoading}
        error={props.friendRankingError}
      />

      <AdminRankingLink href={props.adminRankingHref} />
    </main>
  )
}

export default ChartDetailPage
