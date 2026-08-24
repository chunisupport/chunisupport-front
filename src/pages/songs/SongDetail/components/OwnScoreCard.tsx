import { A } from '@solidjs/router'
import { ChevronRight } from 'lucide-solid'
import { For, Show } from 'solid-js'
import { Loading } from '../../../../components'
import { DifficultyBadge } from '../../../../components/common/DifficultyBadge'
import {
  RECORD_LAMP_COLUMN_CLASS,
  renderDefaultRecordFullChainBadge,
  renderDefaultRecordHardLampBadge,
  renderDefaultRecordLampBadge,
} from '../../../../components/common/record/RecordDisplayParts'
import { getDefaultRecordLampLabel } from '../../../../components/common/record/recordLampLabel'
import { WORLDSEND_SCORE_LABEL } from '../../../../constants/chart'
import {
  buildSongChartDetailPath,
  buildWorldsendChartDetailPath,
  CHART_DETAIL_FROM_SONG_DETAIL_STATE,
} from '../../../../constants/routes'
import type { PlayerDataDifficulty } from '../../../../types/api'
import WorldsendBadge from '../../components/WorldsendBadge'
import {
  OWN_SCORE_CARD_TITLE,
  SCORE_HISTORY_LINK_LABEL,
  UNPLAYED_SCORE_LABEL,
} from '../scoreHistory.constants'

/** 楽曲詳細で表示する難易度別の自己スコアとランプ状態。 */
export type OwnScoreItem = {
  difficulty: PlayerDataDifficulty | typeof WORLDSEND_SCORE_LABEL
  score?: number
  comboLamp?: Parameters<typeof renderDefaultRecordLampBadge>[0]
  clearLamp?: Parameters<typeof renderDefaultRecordHardLampBadge>[0]
  fullChain?: Parameters<typeof renderDefaultRecordFullChainBadge>[0]
  supportsHistory: boolean
}

/** プレイ済み自己スコアカードの共通レイアウトクラス。 */
const OWN_SCORE_CARD_CLASS =
  'flex min-h-24 items-center gap-3 rounded-lg border border-border bg-surface p-4'
/** 自己スコア数値の共通フォント・レイアウトクラス。 */
const OWN_SCORE_VALUE_CLASS = 'font-jost text-xl font-semibold tabular-nums'
/** 自己スコアとランプを縦並びにする共通レイアウトクラス。 */
const OWN_SCORE_VALUE_STACK_CLASS = 'ml-auto flex flex-col items-end gap-1'
/** 自己スコアカード内のランプ表示領域クラス。 */
const OWN_SCORE_LAMPS_CLASS = 'flex gap-2'
/** 未プレイ自己スコアカードの共通レイアウトクラス。 */
const UNPLAYED_OWN_SCORE_CARD_CLASS =
  'flex min-h-24 items-center gap-3 rounded-lg border border-border bg-surface p-4'

/**
 * 自己スコア項目に対応する難易度バッジを表示する。
 *
 * @param props - 表示対象の難易度。
 * @returns 通常難易度または WORLD'S END のバッジ。
 */
const OwnScoreBadge = (props: { difficulty: OwnScoreItem['difficulty'] }) => (
  <Show when={props.difficulty !== WORLDSEND_SCORE_LABEL} fallback={<WorldsendBadge />}>
    <DifficultyBadge difficulty={props.difficulty as PlayerDataDifficulty} />
  </Show>
)

/**
 * 自己スコアに紐づくハード・コンボ・FULL CHAINランプを表示する。
 *
 * @param props - スコアと3種類のランプ状態。
 * @returns ランプバッジ群。
 */
const OwnScoreLamps = (
  props: Pick<OwnScoreItem, 'score' | 'comboLamp' | 'clearLamp' | 'fullChain'>
) => (
  <div class={`${OWN_SCORE_LAMPS_CLASS} ${RECORD_LAMP_COLUMN_CLASS}`}>
    {renderDefaultRecordHardLampBadge(props.clearLamp ?? null)}
    {renderDefaultRecordLampBadge(props.comboLamp ?? null, {
      is_played: true,
      combo_lamp: props.comboLamp ?? null,
      score: props.score ?? 0,
    })}
    {renderDefaultRecordFullChainBadge(props.fullChain ?? null)}
  </div>
)

/**
 * 自己スコアカードへのリンクに使う、ランプ状態を含むアクセシブル名を生成する。
 *
 * @param item - 表示対象の自己スコアとランプ状態。
 * @returns スコア履歴へのリンク内容を説明するアクセシブル名。
 */
const buildOwnScoreLinkAriaLabel = (item: OwnScoreItem): string =>
  [
    item.difficulty,
    item.score?.toLocaleString('ja-JP'),
    `ハード ${item.clearLamp ?? 'なし'}`,
    `コンボ ${getDefaultRecordLampLabel(item.comboLamp ?? null, item.score) || 'なし'}`,
    `FULL CHAIN ${item.fullChain ?? 'なし'}`,
    SCORE_HISTORY_LINK_LABEL,
  ].join(' ')

/**
 * 自己スコア項目に対応する譜面詳細画面パスを生成する。
 *
 * @param displayId - 楽曲表示ID。
 * @param difficulty - 通常難易度または WORLD'S END の表示値。
 * @returns 対応する譜面詳細画面パス。
 */
const buildChartDetailPath = (displayId: string, difficulty: OwnScoreItem['difficulty']): string =>
  difficulty === WORLDSEND_SCORE_LABEL
    ? buildWorldsendChartDetailPath(displayId)
    : buildSongChartDetailPath(displayId, difficulty)

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
            return (
              <li>
                <Show
                  when={item.score !== undefined}
                  fallback={
                    <div class={UNPLAYED_OWN_SCORE_CARD_CLASS}>
                      <OwnScoreBadge difficulty={item.difficulty} />
                      <span class="ml-auto text-sm text-text-muted">{UNPLAYED_SCORE_LABEL}</span>
                    </div>
                  }
                >
                  <Show
                    when={item.supportsHistory}
                    fallback={
                      <div class={OWN_SCORE_CARD_CLASS}>
                        <OwnScoreBadge difficulty={item.difficulty} />
                        <div class={OWN_SCORE_VALUE_STACK_CLASS}>
                          <span class={OWN_SCORE_VALUE_CLASS}>
                            {item.score?.toLocaleString('ja-JP')}
                          </span>
                          <OwnScoreLamps {...item} />
                        </div>
                      </div>
                    }
                  >
                    <A
                      href={buildChartDetailPath(props.displayId, item.difficulty)}
                      state={CHART_DETAIL_FROM_SONG_DETAIL_STATE}
                      class={`${OWN_SCORE_CARD_CLASS} group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
                      aria-label={buildOwnScoreLinkAriaLabel(item)}
                    >
                      <OwnScoreBadge difficulty={item.difficulty} />
                      <div class={OWN_SCORE_VALUE_STACK_CLASS}>
                        <span class={OWN_SCORE_VALUE_CLASS}>
                          {item.score?.toLocaleString('ja-JP')}
                        </span>
                        <OwnScoreLamps {...item} />
                      </div>
                      <ChevronRight
                        class="h-4 w-4 shrink-0 text-action-primary transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
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
