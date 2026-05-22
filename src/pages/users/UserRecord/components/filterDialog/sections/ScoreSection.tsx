import { Checkbox } from '@kobalte/core/checkbox'
import { NumberField } from '@kobalte/core/number-field'
import { Select } from '@kobalte/core/select'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { MAX_SCORE } from '../../../../../../utils/scoreRank'
import { parseNumberInput } from '../../../utils/filterDialog'
import { SCORE_RANKS } from '../../../utils/scoreRank'

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

const ScoreSection: Component<ScoreSectionProps> = (props) => (
  <div>
    {props.scoreFilterMode === 'number' ? (
      <div class="flex gap-2">
        <div class="flex-1">
          <NumberField
            value={props.scoreMinInput}
            onChange={(value: string) => {
              // 0点から1点以上に変更された時、「未プレイ譜面を除外する」をONする
              const prevValue = parseNumberInput(props.scoreMinInput)
              const nextValue = parseNumberInput(value)
              if (
                (prevValue === undefined || prevValue === 0) &&
                nextValue !== undefined &&
                nextValue >= 1
              ) {
                props.onExcludeNoPlayChange(true)
              }
              props.onScoreMinInput(value)
            }}
            class="w-full"
            format={false}
            allowedInput={/[0-9.]/}
            step={1}
          >
            <NumberField.Label class="block text-sm font-medium mb-1">
              スコア(最小)
            </NumberField.Label>
            <NumberField.Input
              id="filter-score-min"
              min={0}
              max={MAX_SCORE}
              step={1}
              class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-surface border-border-strong hover:border-input-border-hover focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => props.onScoreMinCommit(event.currentTarget.value)}
            />
          </NumberField>
        </div>
        <div class="flex-1">
          <NumberField
            value={props.scoreMaxInput}
            onChange={(value: string) => props.onScoreMaxInput(value)}
            class="w-full"
            format={false}
            allowedInput={/[0-9.]/}
            step={1}
          >
            <NumberField.Label class="block text-sm font-medium mb-1">
              スコア(最大)
            </NumberField.Label>
            <NumberField.Input
              id="filter-score-max"
              min={0}
              max={MAX_SCORE}
              step={1}
              class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-surface border-border-strong hover:border-input-border-hover focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => props.onScoreMaxCommit(event.currentTarget.value)}
            />
          </NumberField>
        </div>
      </div>
    ) : (
      <div class="flex gap-2">
        <div class="flex-1">
          <Select
            options={SCORE_RANKS}
            value={props.scoreRankMin}
            onChange={(value) => {
              if (value !== null) {
                if (props.scoreRankMin === '0点' && value !== '0点') {
                  props.onExcludeNoPlayChange(true)
                }
                props.onScoreRankChange('min', value)
              }
            }}
            class="w-full"
            placeholder="選択…"
            itemComponent={(itemProps) => (
              <Select.Item
                item={itemProps.item}
                class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-action-primary data-highlighted:text-text-inverse"
              >
                <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
                <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                  <Check />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Label class="block text-sm font-medium mb-1">スコアランク(最小)</Select.Label>
            <Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-surface border-border-strong hover:border-input-border-hover focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2">
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
        <div class="flex-1">
          <Select
            options={SCORE_RANKS}
            value={props.scoreRankMax}
            onChange={(value) => {
              if (value !== null) {
                if (props.scoreRankMax === '0点' && value !== '0点') {
                  props.onExcludeNoPlayChange(true)
                }
                props.onScoreRankChange('max', value)
              }
            }}
            class="w-full"
            placeholder="選択…"
            itemComponent={(itemProps) => (
              <Select.Item
                item={itemProps.item}
                class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-action-primary data-highlighted:text-text-inverse"
              >
                <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
                <Select.ItemIndicator class="h-5 w-5 inline-flex items-center justify-center">
                  <Check />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Label class="block text-sm font-medium mb-1">スコアランク(最大)</Select.Label>
            <Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-surface border-border-strong hover:border-input-border-hover focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2">
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
