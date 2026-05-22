type SharedSortDirection = 'asc' | 'desc' | null

const SORT_ICON_WRAPPER_CLASS = 'inline-flex h-[3px] w-[18px] shrink-0 items-center justify-center'
const SORT_TRIANGLE_BASE_CLASS = 'h-0 w-0 border-x-[8px] border-x-transparent'

export const NoPlayBadge = () => (
  <span class="rounded-lg bg-surface-hover px-2 py-1 text-xs text-text-subtle">NoPlay</span>
)

export const LampPlaceholderBadge = (props: { class?: string }) => (
  <span
    class={`inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-lg bg-surface-hover px-2 py-1 text-sm font-extrabold text-disabled-text ${props.class ?? ''}`}
    aria-hidden="true"
  >
    {'\u00a0'}
  </span>
)

export const renderSortIndicator = (active: boolean, direction: SharedSortDirection) => {
  if (!active || !direction) {
    return null
  }

  return direction === 'asc' ? (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <span class={`${SORT_TRIANGLE_BASE_CLASS} border-b-[3px] border-b-danger`} />
    </span>
  ) : (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <span class={`${SORT_TRIANGLE_BASE_CLASS} border-t-[3px] border-t-info`} />
    </span>
  )
}
