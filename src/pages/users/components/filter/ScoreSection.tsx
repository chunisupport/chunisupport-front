import { type Component, Show } from 'solid-js'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from '../../../../components/common/filterStyles'
import {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
  SelectRangeInput,
  TextRangeInput,
} from '../../../../components/common/RangeInput'
import { normalizeScoreRangeInput } from '../../../../utils/rangeInput'
import { SCORE_RANKS } from '../../utils/scoreRank'

/** スコア範囲セクションの見出し */
const SCORE_RANGE_TITLE = 'スコア'

/** スコアランク範囲セクションの見出し */
const SCORE_RANK_RANGE_TITLE = 'スコアランク'

/** 未プレイ譜面だけを表示するチェックボックスのラベル */
const UNPLAYED_ONLY_LABEL = '未プレイ譜面のみ'

type ScoreSectionProps = {
  scoreFilterMode: 'number' | 'rank'
  scoreMinInput: string
  scoreMaxInput: string
  scoreRankMin: string
  scoreRankMax: string
  excludeNoPlay: boolean
  /** 未プレイ譜面だけを表示するか。未指定の画面ではチェックボックスを出さない */
  unplayedOnly?: boolean
  onScoreFilterModeChange: (mode: 'number' | 'rank') => void
  onScoreMinInput: (value: string) => void
  onScoreMaxInput: (value: string) => void
  onScoreMinCommit: (value: string) => void
  onScoreMaxCommit: (value: string) => void
  onScoreRankChange: (type: 'min' | 'max', value: string) => void
  onExcludeNoPlayChange: (value: boolean) => void
  /** 未プレイのみの切り替え。未指定の画面ではチェックボックスを出さない */
  onUnplayedOnlyChange?: (value: boolean) => void
}

/**
 * スコア条件の入力欄とランク選択欄を表示する。
 *
 * @param props - スコア条件、表示モード、プレイ状態、各変更ハンドラ。
 * @returns スコアフィルターセクションの JSX 要素。
 */
const ScoreSection: Component<ScoreSectionProps> = (props) => (
  <div>
    {props.scoreFilterMode === 'number' ? (
      <TextRangeInput
        title={SCORE_RANGE_TITLE}
        inputClass={FILTER_DIALOG_FIELD_INPUT_CLASS}
        start={{
          id: 'filter-score-min',
          label: `${SCORE_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
          value: props.scoreMinInput,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          normalizeInput: normalizeScoreRangeInput,
          onInput: props.onScoreMinInput,
          onCommit: props.onScoreMinCommit,
        }}
        end={{
          id: 'filter-score-max',
          label: `${SCORE_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
          value: props.scoreMaxInput,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          normalizeInput: normalizeScoreRangeInput,
          onInput: props.onScoreMaxInput,
          onCommit: props.onScoreMaxCommit,
        }}
      />
    ) : (
      <SelectRangeInput
        title={SCORE_RANK_RANGE_TITLE}
        options={SCORE_RANKS}
        placeholder="選択…"
        start={{
          value: props.scoreRankMin,
          label: `${SCORE_RANK_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
          onChange: (value) => props.onScoreRankChange('min', value),
        }}
        end={{
          value: props.scoreRankMax,
          label: `${SCORE_RANK_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
          onChange: (value) => props.onScoreRankChange('max', value),
        }}
      />
    )}
    <div class="mt-2">
      <CheckboxField
        id="filter-score-mode"
        checked={props.scoreFilterMode === 'number'}
        onChange={(checked) => props.onScoreFilterModeChange(checked ? 'number' : 'rank')}
        class="flex items-center gap-2"
        textVariant="large"
        label="数値で指定"
      />
    </div>
    <div class="mt-2">
      <CheckboxField
        id="filter-exclude-noplay"
        checked={props.excludeNoPlay}
        onChange={(checked) => props.onExcludeNoPlayChange(checked)}
        class="flex items-center gap-2"
        textVariant="large"
        label="未プレイ譜面を除外"
      />
    </div>
    <Show when={props.onUnplayedOnlyChange !== undefined}>
      <div class="mt-2">
        <CheckboxField
          id="filter-unplayed-only"
          checked={props.unplayedOnly === true}
          onChange={(checked) => props.onUnplayedOnlyChange?.(checked)}
          class="flex items-center gap-2"
          textVariant="large"
          label={UNPLAYED_ONLY_LABEL}
        />
      </div>
    </Show>
  </div>
)

export default ScoreSection
