import { For } from 'solid-js'
import { CheckboxField } from '../../../../components/common/CheckboxField'

type LampValue = string | null

type LampSectionProps<TLamp extends LampValue = LampValue> = {
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
const LampSection = <TLamp extends LampValue = LampValue>(props: LampSectionProps<TLamp>) => (
  <div>
    <span class="block text-sm font-medium mb-1">{props.title}</span>
    <div class="flex flex-col gap-2">
      <For each={props.lamps}>
        {(lamp, index) => {
          const id = `filter-${props.idPrefix}-${index()}`
          return (
            <CheckboxField
              id={id}
              checked={props.selected.includes(lamp)}
              onChange={() => {
                props.onToggle(lamp)
              }}
              class="flex items-center gap-2"
              textVariant="choice"
              label={props.formatLabel ? props.formatLabel(lamp) : (lamp ?? 'なし')}
            />
          )
        }}
      </For>
    </div>
  </div>
)

export default LampSection
