import type { RecordSortKey, SortDirection } from '../types/types'

const INACTIVE_LABEL_CLASS = 'text-gray-700'
const ASC_LABEL_CLASS = 'text-rose-600'
const DESC_LABEL_CLASS = 'text-sky-600'

export const sortHeaderLabelClass = (
  currentSortKey: RecordSortKey | null,
  currentSortDirection: SortDirection | null,
  targetSortKey: RecordSortKey
): string => {
  if (currentSortKey !== targetSortKey || !currentSortDirection) {
    return INACTIVE_LABEL_CLASS
  }

  return currentSortDirection === 'asc' ? ASC_LABEL_CLASS : DESC_LABEL_CLASS
}
