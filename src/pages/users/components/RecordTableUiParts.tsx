import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-solid'

type SharedSortDirection = 'asc' | 'desc' | null

const SORT_ICON_CLASS = 'h-3 w-3 shrink-0'
const SORT_ICON_WRAPPER_CLASS = 'inline-flex h-3 w-3 shrink-0 items-center justify-center'

export const NoPlayBadge = () => (
  <span class="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400">NoPlay</span>
)

export const LampPlaceholderBadge = () => (
  <span
    class="inline-flex min-h-[30px] min-w-[30px] items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-sm font-extrabold text-gray-300"
    aria-hidden="true"
  >
    {'\u00a0'}
  </span>
)

export const renderSortIndicator = (active: boolean, direction: SharedSortDirection) => {
  if (!active || !direction) {
    return (
      <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
        <ArrowUpDown class={`${SORT_ICON_CLASS} text-gray-300`} />
      </span>
    )
  }

  return direction === 'asc' ? (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <ArrowUp class={`${SORT_ICON_CLASS} text-red-600`} />
    </span>
  ) : (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <ArrowDown class={`${SORT_ICON_CLASS} text-sky-600`} />
    </span>
  )
}
