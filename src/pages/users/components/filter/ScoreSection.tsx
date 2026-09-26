import { t } from '../../../../i18n'
import type { Component } from 'solid-js'
import { CheckboxField } from '../../../../components/common/CheckboxField'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from '../../../../components/common/filterStyles'
import {
  RANGE_INPUT_COPY,
  SelectRangeInput,
  TextRangeInput,
} from '../../../../components/common/RangeInput'
import { normalizeScoreRangeInput } from '../../../../utils/rangeInput'
import { SCORE_RANKS } from '../../utils/scoreRank'

/** スコア範囲セクションの見出し */
const SCORE_RANGE_TITLE = t('users.filter.score')

/** スコアランク範囲セクションの見出し */
const SCORE_RANK_RANGE_TITLE = t('users.filter.scoreRank')

type ScoreSectionProps = {
  scoreFilterMode: 'number' | 'rank'
  scoreMinInput: string
  scoreMaxInput: string
  scoreRankMin: string
  scoreRankMax: string
  excludeNoPlay: boolean
  onScoreFilterModeChange: (mode: 'number' | 'rank') => void
  onScoreMinInput: (value: string) => void
  onScoreMaxInput: (value: string) => void
  onScoreMinCommit: (value: string) => void
  onScoreMaxCommit: (value: string) => void
  onScoreRankChange: (type: 'min' | 'max', value: string) => void
  onExcludeNoPlayChange: (value: boolean) => void
}

/**
 * スコア条件の入力欄とランク選択欄を表示する。
 *
 * @param props - スコア条件、表示モード、未プレイ除外状態、各変更ハンドラ。
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
          label: `${SCORE_RANGE_TITLE} ${RANGE_INPUT_COPY.startSuffix}`,
          value: props.scoreMinInput,
          inputMode: 'numeric',
          pattern: '[0-9]*',
          normalizeInput: normalizeScoreRangeInput,
          onInput: props.onScoreMinInput,
          onCommit: props.onScoreMinCommit,
        }}
        end={{
          id: 'filter-score-max',
          label: `${SCORE_RANGE_TITLE} ${RANGE_INPUT_COPY.endSuffix}`,
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
        formatLabel={(rank) => (rank === '0点' ? t('users.filter.zeroScore') : rank)}
        placeholder={t('common.selectPlaceholder')}
        start={{
          value: props.scoreRankMin,
          label: `${SCORE_RANK_RANGE_TITLE} ${RANGE_INPUT_COPY.startSuffix}`,
          onChange: (value) => props.onScoreRankChange('min', value),
        }}
        end={{
          value: props.scoreRankMax,
          label: `${SCORE_RANK_RANGE_TITLE} ${RANGE_INPUT_COPY.endSuffix}`,
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
        label={t('users.filter.useNumber')}
      />
    </div>
    <div class="mt-2">
      <CheckboxField
        id="filter-exclude-noplay"
        checked={props.excludeNoPlay}
        onChange={(checked) => props.onExcludeNoPlayChange(checked)}
        class="flex items-center gap-2"
        textVariant="large"
        label={t('users.filter.excludeUnplayed')}
      />
    </div>
  </div>
)

export default ScoreSection
