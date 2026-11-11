import Eye from 'lucide-solid/icons/eye'
import EyeOff from 'lucide-solid/icons/eye-off'
import { createMemo, createSignal, Show } from 'solid-js'
import { AppIconButton } from '../../components/common/AppButton'
import { ClassEmblem } from '../../components/common/profile/ClassEmblem'
import type { NormalizedPlayerDataUpdateResult } from '../../usecases/registerScoreCommit'
import { resolveClassEmblemMasterName } from '../../utils/classEmblem'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { formatPlayerLevelLabel } from '../../utils/playerLevel'
import { REGISTER_SCORE_COPY } from './constants'
import {
  formatRegisterScoreNullableRating,
  REGISTER_SCORE_NO_DATA_TEXT,
} from './registerScoreDisplay'
import {
  formatRegisterScoreOverPowerDelta,
  formatRegisterScoreOverPowerPercentDelta,
  formatRegisterScoreRatingDelta,
  getRegisterScoreMetricDeltaClass,
} from './registerScoreMetricDiff'

/** プロフィール概要の値に適用する共通クラス */
const PROFILE_VALUE_CLASS = 'font-jost text-base font-normal leading-6'

/** プレイヤーメトリクス差分の表示情報 */
type RegisterScoreMetricDeltaProps = {
  /** APIが返した更新前後の差分 */
  delta: number | null
  /** 表示精度へ整形した符号付き差分 */
  formattedDelta: string | null
  /** 差分の後ろへ表示する単位 */
  unit?: string
  /** 単位を読み上げる際の名称 */
  accessibleUnit?: string
}

/**
 * プレイヤーメトリクスの符号付き差分を共通形式で表示する。
 *
 * @param props - 生の差分値、整形済み差分、および任意の単位。
 * @returns 表示対象の差分がある場合は括弧付き差分、それ以外は何も表示しない。
 */
const RegisterScoreMetricDelta = (props: RegisterScoreMetricDeltaProps) => (
  <Show when={props.formattedDelta}>
    {(formattedDelta) => (
      <span class={`text-sm font-bold ${getRegisterScoreMetricDeltaClass(props.delta)}`}>
        ({formattedDelta()}
        <Show when={props.unit}>{(unit) => <span aria-hidden="true"> {unit()}</span>}</Show>
        <Show when={props.accessibleUnit}>
          {(accessibleUnit) => <span class="sr-only"> {accessibleUnit()}</span>}
        </Show>
        )
      </span>
    )}
  </Show>
)

/**
 * 更新差分レポートのプレイヤーレベル表示を切り替える。画像には含めない。
 *
 * @param props - 現在の非表示状態と変更ハンドラー。
 * @returns レベル表示を切り替えるアイコンボタン。
 */
const RegisterScorePlayerLevelVisibilityButton = (props: {
  hidePlayerLevel: boolean
  onChange: (hidePlayerLevel: boolean) => void
}) => (
  <AppIconButton
    tone="ghost"
    aria-label={
      props.hidePlayerLevel
        ? REGISTER_SCORE_COPY.showPlayerLevel
        : REGISTER_SCORE_COPY.hidePlayerLevel
    }
    aria-pressed={props.hidePlayerLevel}
    title={
      props.hidePlayerLevel
        ? REGISTER_SCORE_COPY.showPlayerLevel
        : REGISTER_SCORE_COPY.hidePlayerLevel
    }
    data-image-capture-excluded="true"
    onClick={() => props.onChange(!props.hidePlayerLevel)}
  >
    <Show when={props.hidePlayerLevel} fallback={<Eye class="h-5 w-5" aria-hidden="true" />}>
      <EyeOff class="h-5 w-5" aria-hidden="true" />
    </Show>
  </AppIconButton>
)

/**
 * プレイヤー概要をレポート形式で表示する。
 *
 * @param props - APIから返却された登録結果と、クラスエンブレムの表示状態。
 * @returns プロフィール概要。
 */
export const RegisterScoreProfileSummary = (props: {
  result: NormalizedPlayerDataUpdateResult
  showClassEmblem: boolean
}) => {
  const [hidePlayerLevel, setHidePlayerLevel] = createSignal(false)
  const ratingDelta = createMemo(() =>
    formatRegisterScoreRatingDelta(props.result.metric_diffs.rating.delta)
  )
  const overPowerDelta = createMemo(() =>
    formatRegisterScoreOverPowerDelta(props.result.metric_diffs.overpower_value.delta)
  )
  const overPowerPercentDelta = createMemo(() =>
    formatRegisterScoreOverPowerPercentDelta(props.result.metric_diffs.overpower_percent.delta)
  )

  return (
    <section class="pb-3">
      <div class="flex items-center gap-2 border-b border-border bg-surface-muted px-3 py-2.5">
        <div class="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 font-sans text-xl font-extrabold leading-none">
          <span class="flex shrink-0 items-center gap-1 whitespace-nowrap tracking-normal">
            <span>{formatPlayerLevelLabel(props.result.profile.level, hidePlayerLevel())}</span>
            <RegisterScorePlayerLevelVisibilityButton
              hidePlayerLevel={hidePlayerLevel()}
              onChange={setHidePlayerLevel}
            />
          </span>
          <span class="min-w-0 truncate text-center">{props.result.profile.name}</span>
        </div>
        <Show when={props.showClassEmblem}>
          <ClassEmblem
            emblem={resolveClassEmblemMasterName(props.result.profile.class_emblem_id)}
            base={resolveClassEmblemMasterName(props.result.profile.class_emblem_base_id)}
            class="h-7"
          />
        </Show>
      </div>
      <dl class="grid grid-cols-[7rem_1fr] gap-x-3 px-5 pt-2 text-base leading-6">
        <dt class="font-extrabold text-text-muted">{REGISTER_SCORE_COPY.ratingLabel}</dt>
        <dd class={`${PROFILE_VALUE_CLASS} flex items-baseline gap-2 whitespace-nowrap`}>
          <span>{formatRegisterScoreNullableRating(props.result.summary.rating)}</span>
          <RegisterScoreMetricDelta
            delta={props.result.metric_diffs.rating.delta}
            formattedDelta={ratingDelta()}
          />
        </dd>
        <dt class="whitespace-nowrap font-extrabold text-text-muted">
          {REGISTER_SCORE_COPY.overPowerLabel}
        </dt>
        <dd class={`${PROFILE_VALUE_CLASS} flex items-baseline gap-2 whitespace-nowrap`}>
          <Show
            when={props.result.summary.overpower_value !== null}
            fallback={REGISTER_SCORE_NO_DATA_TEXT}
          >
            <span>{formatOverPowerValue(props.result.summary.overpower_value ?? 0)}</span>
          </Show>
          <RegisterScoreMetricDelta
            delta={props.result.metric_diffs.overpower_value.delta}
            formattedDelta={overPowerDelta()}
          />
        </dd>
        <dt class="font-extrabold text-text-muted">
          <span aria-hidden="true">{REGISTER_SCORE_COPY.overPowerPercentLabel}</span>
          <span class="sr-only">{REGISTER_SCORE_COPY.overPowerPercentAccessibleLabel}</span>
        </dt>
        <dd class={`${PROFILE_VALUE_CLASS} flex items-baseline gap-2 whitespace-nowrap`}>
          <Show
            when={props.result.summary.overpower_percentage !== null}
            fallback={REGISTER_SCORE_NO_DATA_TEXT}
          >
            <span>{formatOverPowerPercent(props.result.summary.overpower_percentage ?? 0)}%</span>
          </Show>
          <RegisterScoreMetricDelta
            delta={props.result.metric_diffs.overpower_percent.delta}
            formattedDelta={overPowerPercentDelta()}
            unit={REGISTER_SCORE_COPY.percentagePointUnit}
            accessibleUnit={REGISTER_SCORE_COPY.percentagePointAccessibleUnit}
          />
        </dd>
      </dl>
    </section>
  )
}
