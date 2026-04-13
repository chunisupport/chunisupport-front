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
      <div class="w-full rounded-2xl border border-primary-200 bg-gradient-to-br from-white to-primary-50 p-8 text-center shadow-sm">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
          <span class="text-2xl font-semibold" aria-hidden="true">
            !
          </span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900">{title()}</h1>
        <p class="mt-3 text-sm leading-7 text-gray-600">{message()}</p>
      </div>
    </section>
  )
}

export default PlayerDataEmptyState
