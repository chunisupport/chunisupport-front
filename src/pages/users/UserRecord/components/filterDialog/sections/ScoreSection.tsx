import { Checkbox } from '@kobalte/core/checkbox'
import { NumberField } from '@kobalte/core/number-field'
import { Select } from '@kobalte/core/select'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { MAX_SCORE } from '../../../../../../utils/scoreRank'

import { SCORE_RANKS } from '../../../utils/scoreRank'
import {
  FILTER_DIALOG_FIELD_INPUT_CLASS,
  FILTER_DIALOG_SELECT_ITEM_CLASS,
  FILTER_DIALOG_SELECT_TRIGGER_CLASS,
} from '../styles'
import RangeSeparator, { RANGE_END_LABEL_SUFFIX, RANGE_START_LABEL_SUFFIX } from './RangeSeparator'

/** スコア範囲セクションの見出し。 */
const SCORE_RANGE_TITLE = 'スコア'

/** スコアランク範囲セクションの見出し。 */
const SCORE_RANK_RANGE_TITLE = 'スコアランク'

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
      <>
        <div class="mb-1 text-sm font-medium">{SCORE_RANGE_TITLE}</div>
        <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
          <div class="min-w-0">
            <NumberField
              value={props.scoreMinInput}
              onChange={(value: string) => {
                props.onScoreMinInput(value)
              }}
              class="w-full"
              format={false}
              allowedInput={/[0-9.]/}
              step={1}
            >
              <NumberField.Label class="sr-only">
                {SCORE_RANGE_TITLE} {RANGE_START_LABEL_SUFFIX}
              </NumberField.Label>
              <NumberField.Input
                id="filter-score-min"
                min={0}
                max={MAX_SCORE}
                step={1}
                class={FILTER_DIALOG_FIELD_INPUT_CLASS}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => props.onScoreMinCommit(event.currentTarget.value)}
              />
            </NumberField>
          </div>
          <RangeSeparator />
          <div class="min-w-0">
            <NumberField
              value={props.scoreMaxInput}
              onChange={(value: string) => props.onScoreMaxInput(value)}
              class="w-full"
              format={false}
              allowedInput={/[0-9.]/}
              step={1}
            >
              <NumberField.Label class="sr-only">
                {SCORE_RANGE_TITLE} {RANGE_END_LABEL_SUFFIX}
              </NumberField.Label>
              <NumberField.Input
                id="filter-score-max"
                min={0}
                max={MAX_SCORE}
                step={1}
                class={FILTER_DIALOG_FIELD_INPUT_CLASS}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={(event) => props.onScoreMaxCommit(event.currentTarget.value)}
              />
            </NumberField>
          </div>
        </div>
      </>
    ) : (
      <>
        <div class="mb-1 text-sm font-medium">{SCORE_RANK_RANGE_TITLE}</div>
        <div class="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-end gap-2">
          <div class="min-w-0">
            <Select
              options={SCORE_RANKS}
              value={props.scoreRankMin}
              onChange={(value) => {
                if (value !== null) {
                  props.onScoreRankChange('min', value)
                }
              }}
              class="w-full"
              placeholder="選択…"
              itemComponent={(itemProps) => (
                <Select.Item item={itemProps.item} class={FILTER_DIALOG_SELECT_ITEM_CLASS}>
                  <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
                  <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                    <Check />
                  </Select.ItemIndicator>
                </Select.Item>
              )}
            >
              <Select.Label class="sr-only">
                {SCORE_RANK_RANGE_TITLE} {RANGE_START_LABEL_SUFFIX}
              </Select.Label>
              <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
                <Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
                  {(state) => state.selectedOption()}
                </Select.Value>
                <Select.Icon class="h-5 w-5 flex items-center justify-center">
                  <ChevronDown />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content class="z-60 bg-surface rounded-md border border-border-strong shadow-lg">
                  <Select.Listbox class="overflow-y-auto max-h-90 p-2" />
                </Select.Content>
              </Select.Portal>
            </Select>
          </div>
          <RangeSeparator />
          <div class="min-w-0">
            <Select
              options={SCORE_RANKS}
              value={props.scoreRankMax}
              onChange={(value) => {
                if (value !== null) {
                  props.onScoreRankChange('max', value)
                }
              }}
              class="w-full"
              placeholder="選択…"
              itemComponent={(itemProps) => (
                <Select.Item item={itemProps.item} class={FILTER_DIALOG_SELECT_ITEM_CLASS}>
                  <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
                  <Select.ItemIndicator class="h-5 w-5 inline-flex items-center justify-center">
                    <Check />
                  </Select.ItemIndicator>
                </Select.Item>
              )}
            >
              <Select.Label class="sr-only">
                {SCORE_RANK_RANGE_TITLE} {RANGE_END_LABEL_SUFFIX}
              </Select.Label>
              <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
                <Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
                  {(state) => state.selectedOption()}
                </Select.Value>
                <Select.Icon class="h-5 w-5 flex items-center justify-center">
                  <ChevronDown />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content class="z-60 bg-surface rounded-md border border-border-strong shadow-lg">
                  <Select.Listbox class="overflow-y-auto max-h-90 p-2" />
                </Select.Content>
              </Select.Portal>
            </Select>
          </div>
        </div>
      </>
    )}
    <div class="mt-2">
      <Checkbox
        checked={props.scoreFilterMode === 'number'}
        onChange={(checked) => props.onScoreFilterModeChange(checked ? 'number' : 'rank')}
        class="flex items-center gap-2"
      >
        <Checkbox.Input id="filter-score-mode" />
        <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="leading-5" for="filter-score-mode">
          数値で指定する
        </Checkbox.Label>
      </Checkbox>
    </div>
    <div class="mt-2">
      <Checkbox
        checked={props.excludeNoPlay}
        onChange={(checked) => props.onExcludeNoPlayChange(checked)}
        class="flex items-center gap-2"
      >
        <Checkbox.Input id="filter-exclude-noplay" />
        <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="leading-5" for="filter-exclude-noplay">
          未プレイ譜面を除外する
        </Checkbox.Label>
      </Checkbox>
    </div>
  </div>
)

export default ScoreSection
