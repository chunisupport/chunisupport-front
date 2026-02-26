import { Checkbox } from '@kobalte/core/checkbox'
import { NumberField } from '@kobalte/core/number-field'
import { Select } from '@kobalte/core/select'
import { Check, ChevronDown } from 'lucide-solid'
import type { Component } from 'solid-js'

const CONST_LEVEL_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '7+',
  '8',
  '8+',
  '9',
  '9+',
  '10',
  '10+',
  '11',
  '11+',
  '12',
  '12+',
  '13',
  '13+',
  '14',
  '14+',
  '15',
  '15+',
]

type ConstRangeSectionProps = {
  constFilterMode: 'level' | 'number'
  minValue: string
  maxValue: string
  constLevelMin: string
  constLevelMax: string
  onMinInput: (value: string) => void
  onMaxInput: (value: string) => void
  onMinCommit: (value: string) => void
  onMaxCommit: (value: string) => void
  onConstFilterModeChange: (mode: 'level' | 'number') => void
  onConstLevelChange: (type: 'min' | 'max', value: string) => void
}

const ConstRangeSection: Component<ConstRangeSectionProps> = (props) => (
  <div>
    {props.constFilterMode === 'number' ? (
      <div class="flex gap-2">
        <div class="flex-1">
          <NumberField
            value={props.minValue}
            onChange={(value: string) => props.onMinInput(value)}
            class="w-full"
            format={false}
            allowedInput={/[0-9.]/}
            step={0.1}
          >
            <NumberField.Label class="block text-sm font-medium mb-1">定数(最小)</NumberField.Label>
            <NumberField.Input
              id="filter-const-min"
              class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400  focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => props.onMinCommit(event.currentTarget.value)}
            />
          </NumberField>
        </div>
        <div class="flex-1">
          <NumberField
            value={props.maxValue}
            onChange={(value: string) => props.onMaxInput(value)}
            class="w-full"
            format={false}
            allowedInput={/[0-9.]/}
            step={0.1}
          >
            <NumberField.Label class="block text-sm font-medium mb-1">定数(最大)</NumberField.Label>
            <NumberField.Input
              id="filter-const-max"
              min={0}
              max={15.9}
              step={0.1}
              class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
              onFocus={(event) => event.currentTarget.select()}
              onBlur={(event) => props.onMaxCommit(event.currentTarget.value)}
            />
          </NumberField>
        </div>
      </div>
    ) : (
      <div class="flex gap-2">
        <div class="flex-1">
          <Select
            options={CONST_LEVEL_OPTIONS}
            value={props.constLevelMin}
            onChange={(value) => {
              if (value !== null) props.onConstLevelChange('min', value)
            }}
            class="w-full"
            placeholder="選択…"
            itemComponent={(itemProps) => (
              <Select.Item
                item={itemProps.item}
                class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-green-600 data-highlighted:text-white"
              >
                <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
                <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                  <Check />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Label class="block text-sm font-medium mb-1">レベル(最小)</Select.Label>
            <Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2">
              <Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-gray-400">
                {(state) => state.selectedOption()}
              </Select.Value>
              <Select.Icon class="h-5 w-5 flex items-center justify-center">
                <ChevronDown />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="z-60 bg-white rounded-md border border-gray-300 shadow-lg">
                <Select.Listbox class="overflow-y-auto max-h-90 p-2" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>
        <div class="flex-1">
          <Select
            options={CONST_LEVEL_OPTIONS}
            value={props.constLevelMax}
            onChange={(value) => {
              if (value !== null) props.onConstLevelChange('max', value)
            }}
            class="w-full"
            placeholder="選択…"
            itemComponent={(itemProps) => (
              <Select.Item
                item={itemProps.item}
                class="text-sm rounded flex items-center justify-between h-8 px-2 outline-none cursor-pointer data-disabled:opacity-50 data-disabled:pointer-events-none data-highlighted:bg-green-600 data-highlighted:text-white"
              >
                <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
                <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                  <Check />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Label class="block text-sm font-medium mb-1">レベル(最大)</Select.Label>
            <Select.Trigger class="inline-flex items-center justify-between w-full border rounded px-3 py-2 text-sm bg-white border-gray-300 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2">
              <Select.Value<string> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-gray-400">
                {(state) => state.selectedOption()}
              </Select.Value>
              <Select.Icon class="h-5 w-5 flex items-center justify-center">
                <ChevronDown />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="z-60 bg-white rounded-md border border-gray-300 shadow-lg">
                <Select.Listbox class="overflow-y-auto max-h-90 p-2" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>
      </div>
    )}
    <div class="mt-2">
      <Checkbox
        checked={props.constFilterMode === 'number'}
        onChange={(checked) => props.onConstFilterModeChange(checked ? 'number' : 'level')}
        class="flex items-center"
      >
        <Checkbox.Input id="filter-const-mode" />
        <Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-green-600 data-checked:bg-green-600 data-checked:text-white flex items-center justify-center mr-2">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label for="filter-const-mode">譜面定数で指定</Checkbox.Label>
      </Checkbox>
    </div>
  </div>
)

export default ConstRangeSection
