import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import { For } from 'solid-js'

type LampValue = string | null

type LampSectionProps<TLamp extends LampValue> = {
  title: string
  idPrefix: string
  lamps: TLamp[]
  selected: TLamp[]
  onToggle: (lamp: TLamp) => void
  onExcludeNoPlayChange: (value: boolean) => void
  formatLabel?: (lamp: TLamp) => string
}

/**
 * ランプ系フィルターの選択肢をチェックボックス一覧で表示する。
 *
 * @template TLamp - 対象セクションで扱うランプ値の型。
 * @param props - 表示対象のランプ候補、選択状態、更新ハンドラー。
 * @returns ランプ選択セクション
 */
const LampSection = <TLamp extends LampValue>(props: LampSectionProps<TLamp>) => (
  <div>
    <span class="block text-sm font-medium mb-1">{props.title}</span>
    <div class="flex flex-col gap-2">
      <For each={props.lamps}>
        {(lamp, index) => {
          const id = `filter-${props.idPrefix}-${index()}`
          return (
            <Checkbox
              checked={props.selected.includes(lamp)}
              onChange={() => {
                props.onToggle(lamp)
              }}
              class="flex items-center gap-2"
            >
              <Checkbox.Input id={id} />
              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
                <Checkbox.Indicator>
                  <Check class="h-4 w-4" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="leading-5" for={id}>
                {props.formatLabel ? props.formatLabel(lamp) : (lamp ?? 'なし')}
              </Checkbox.Label>
            </Checkbox>
          )
        }}
      </For>
    </div>
  </div>
)

export default LampSection
