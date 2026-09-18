import type { SwitchRootProps } from '@kobalte/core/switch'
import { Switch } from '@kobalte/core/switch'
import type { JSX } from 'solid-js'
import { splitProps } from 'solid-js'

export type AppSwitchProps = Omit<SwitchRootProps, 'children'> & {
  /** スイッチの操作内容を表すアクセシブルなラベル */
  label: string
  /** Switch ルートへ追加で適用する Tailwind クラス */
  class?: string
}

/**
 * アプリ共通の見た目とアクセシブルなラベルを持つトグルスイッチを表示する。
 *
 * @param props - スイッチの状態、変更通知、無効状態、ラベル。
 * @returns Kobalte Switch を使ったトグルスイッチ。
 */
export const AppSwitch = (props: AppSwitchProps): JSX.Element => {
  const [local, switchProps] = splitProps(props, ['label', 'class'])

  return (
    <Switch {...switchProps} class={local.class}>
      <Switch.Input aria-label={local.label} />
      <Switch.Control class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-border-strong transition data-[checked]:bg-action-primary data-disabled:cursor-not-allowed data-disabled:opacity-60">
        <Switch.Thumb class="inline-block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition data-[checked]:translate-x-5" />
      </Switch.Control>
    </Switch>
  )
}
