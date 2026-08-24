import { Collapsible } from '@kobalte/core/collapsible'
import { ChevronRight } from 'lucide-solid'
import type { Component, JSX } from 'solid-js'
import { Show } from 'solid-js'

type AppDisclosureTriggerVariant = 'default' | 'compact'

type AppDisclosureTriggerProps = {
  /** 開閉ヘッダーの主ラベル */
  label: JSX.Element
  /** 右側に表示する補足内容 */
  summary?: JSX.Element
  /** 表示密度 */
  variant?: AppDisclosureTriggerVariant
  /** Trigger ルートへ追加で適用する Tailwind クラス */
  class?: string
  /** Chevron アイコンへ追加で適用する Tailwind クラス */
  chevronClass?: string
  /** 主ラベルへ追加で適用する Tailwind クラス */
  labelClass?: string
  /** 補足内容へ追加で適用する Tailwind クラス */
  summaryClass?: string
}

const APP_DISCLOSURE_TRIGGER_BASE_CLASS =
  'group flex w-full items-center gap-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

const APP_DISCLOSURE_TRIGGER_VARIANT_CLASS: Record<AppDisclosureTriggerVariant, string> = {
  default: 'min-h-8 px-3',
  compact: 'justify-start font-semibold text-text',
}

const APP_DISCLOSURE_CHEVRON_CLASS =
  'h-4 w-4 shrink-0 text-text-muted transition-transform group-data-expanded:rotate-90'

const APP_DISCLOSURE_LABEL_CLASS = 'min-w-0 flex-1 text-left'

const APP_DISCLOSURE_SUMMARY_CLASS = 'shrink-0 text-xs text-text-muted'

/**
 * アプリ全体で使う Collapsible の開閉ヘッダーを表示する。
 *
 * @param props - 表示ラベル、補足内容、密度、追加クラス。
 * @returns Kobalte Collapsible.Trigger を使った開閉ヘッダー。
 */
export const AppDisclosureTrigger: Component<AppDisclosureTriggerProps> = (props) => (
  <Collapsible.Trigger
    class={`${APP_DISCLOSURE_TRIGGER_BASE_CLASS} ${
      APP_DISCLOSURE_TRIGGER_VARIANT_CLASS[props.variant ?? 'default']
    } ${props.class ?? ''}`}
  >
    <ChevronRight
      class={`${APP_DISCLOSURE_CHEVRON_CLASS} ${props.chevronClass ?? ''}`}
      aria-hidden="true"
    />
    <span class={`${APP_DISCLOSURE_LABEL_CLASS} ${props.labelClass ?? ''}`}>{props.label}</span>
    <Show when={props.summary}>
      {(summary) => (
        <span class={`${APP_DISCLOSURE_SUMMARY_CLASS} ${props.summaryClass ?? ''}`}>
          {summary()}
        </span>
      )}
    </Show>
  </Collapsible.Trigger>
)
