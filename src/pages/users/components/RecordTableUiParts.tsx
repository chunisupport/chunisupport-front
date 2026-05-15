type SharedSortDirection = 'asc' | 'desc' | null

const SORT_ICON_WRAPPER_CLASS = 'inline-flex h-[3px] w-[18px] shrink-0 items-center justify-center'
const SORT_TRIANGLE_BASE_CLASS = 'h-0 w-0 border-x-[8px] border-x-transparent'

export const NoPlayBadge = () => (
  <span class="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400">NoPlay</span>
)

export const LampPlaceholderBadge = (props: { class?: string }) => (
  <span
    class={`inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-extrabold text-gray-300 ${props.class ?? ''}`}
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
      <span class={`${SORT_TRIANGLE_BASE_CLASS} border-b-[3px] border-b-red-600`} />
    </span>
  ) : (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <span class={`${SORT_TRIANGLE_BASE_CLASS} border-t-[3px] border-t-sky-600`} />
    </span>
  )
}
