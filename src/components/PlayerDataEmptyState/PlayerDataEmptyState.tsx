import type { Component } from 'solid-js'

type PlayerDataEmptyStateProps = {
  title?: string
  message?: string
}

const PlayerDataEmptyState: Component<PlayerDataEmptyStateProps> = (props) => {
  const title = () => props.title ?? 'プレイヤーデータが未登録です'
  const message = () => props.message ?? 'まずはChuniSupportにスコアを登録してみましょう。'

  return (
    <section class="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-12">
      <div class="w-full rounded-2xl border border-action-primary-border bg-gradient-to-br from-surface to-action-primary-muted p-8 text-center shadow-sm">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-action-primary-muted text-action-primary">
          <span class="text-2xl font-semibold" aria-hidden="true">
            !
          </span>
        </div>
        <h1 class="text-2xl font-semibold text-text">{title()}</h1>
        <p class="mt-3 text-sm leading-7 text-text-muted">{message()}</p>
      </div>
    </section>
  )
}

export default PlayerDataEmptyState
