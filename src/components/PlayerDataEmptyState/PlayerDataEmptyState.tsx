import { Button } from '@kobalte/core/button'
import { Check, Copy } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, Show } from 'solid-js'
import { CHUNISUPPORT_BOOKMARKLET, PLAYER_DATA_EMPTY_STATE_TEXT } from './constants'

type PlayerDataEmptyStateProps = {
  title?: string
  message?: string
}

/**
 * プレイヤーデータ未登録時の案内を表示する。
 * @param props 表示タイトルとメッセージの上書き設定
 * @returns プレイヤーデータ未登録時の案内コンポーネント
 */
const PlayerDataEmptyState: Component<PlayerDataEmptyStateProps> = (props) => {
  const [copyState, setCopyState] = createSignal<'idle' | 'copied' | 'failed'>('idle')
  const title = () => props.title ?? 'プレイヤーデータが未登録です'
  const message = () => props.message ?? 'まずはChuniSupportにスコアを登録してみましょう。'

  /**
   * ブックマークレットをクリップボードへコピーする。
   * @returns なし
   */
  const handleCopyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(CHUNISUPPORT_BOOKMARKLET)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <section class="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-12">
      <div class="w-full rounded-2xl border border-action-primary-border bg-gradient-to-br from-surface to-action-primary-muted p-8 text-center shadow-sm">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-success-border bg-success-bg text-action-primary shadow-sm">
          <span class="text-2xl font-semibold" aria-hidden="true">
            !
          </span>
        </div>
        <h1 class="text-2xl font-semibold text-text">{title()}</h1>
        <p class="mt-3 text-sm leading-7 text-text-muted">{message()}</p>
        <div class="mt-6 rounded-lg border border-border bg-surface p-4 text-left">
          <p class="text-sm font-semibold text-text">
            {PLAYER_DATA_EMPTY_STATE_TEXT.bookmarkletTitle}
          </p>
          <p class="mt-1 text-sm leading-6 text-text-muted">
            {PLAYER_DATA_EMPTY_STATE_TEXT.bookmarkletDescription}
          </p>
          <code class="mt-3 block break-all rounded-md border border-border bg-surface-muted p-3 font-mono text-xs leading-6 text-text">
            {CHUNISUPPORT_BOOKMARKLET}
          </code>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleCopyBookmarklet}
              class="inline-flex items-center gap-2 rounded-md bg-action-primary px-3 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover focus:outline-none focus:ring-2 focus:ring-focus"
            >
              <Copy class="h-4 w-4" aria-hidden="true" />
              {PLAYER_DATA_EMPTY_STATE_TEXT.copyButton}
            </Button>
            <Show when={copyState() === 'copied'}>
              <span
                class="inline-flex items-center gap-1 text-xs text-action-primary"
                aria-live="polite"
              >
                <Check class="h-4 w-4" aria-hidden="true" />
                {PLAYER_DATA_EMPTY_STATE_TEXT.copiedLabel}
              </span>
            </Show>
            <Show when={copyState() === 'failed'}>
              <span class="text-xs text-danger" aria-live="polite">
                {PLAYER_DATA_EMPTY_STATE_TEXT.copyFailedLabel}
              </span>
            </Show>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlayerDataEmptyState
