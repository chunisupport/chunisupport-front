export const NoPlayBadge = () => (
  <span class="rounded-lg bg-surface-hover px-2 py-1 text-xs text-text-subtle">NoPlay</span>
)

export const LampPlaceholderBadge = (props: { class?: string }) => (
  <span
    class={`inline-flex min-h-7.5 min-w-7.5 items-center justify-center rounded-lg bg-surface-hover px-2 py-1 text-sm font-extrabold text-disabled-text ${props.class ?? ''}`}
    aria-hidden="true"
  >
    {'\u00a0'}
  </span>
)
