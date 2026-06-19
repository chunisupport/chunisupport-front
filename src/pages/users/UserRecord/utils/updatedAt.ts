const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

export const formatUpdatedAt = (updatedAt: string | null): string => {
  if (!updatedAt) {
    return '-'
  }

  const matched = updatedAt.match(YMD_PATTERN)
  if (matched) {
    return `${matched[1].slice(-2)}/${matched[2]}/${matched[3]}`
  }

  const parsed = new Date(updatedAt)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  const year = String(parsed.getUTCFullYear()).slice(-2)
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')

  return `${year}/${month}/${day}`
}

export const updatedAtTimestamp = (updatedAt: string | null): number => {
  if (!updatedAt) {
    return Number.NEGATIVE_INFINITY
  }

  const ts = Date.parse(updatedAt)
  return Number.isNaN(ts) ? Number.NEGATIVE_INFINITY : ts
}

export const hasValidUpdatedAtTimestamp = (timestamp: number): boolean => {
  return timestamp !== Number.NEGATIVE_INFINITY
}

export type UpdatedAtSortable = {
  isPlayed: boolean
  updatedAtTimestamp: number
}

export const compareUpdatedAtWithMissingLast = (
  left: UpdatedAtSortable,
  right: UpdatedAtSortable
): number => {
  const leftMissing = !left.isPlayed || !hasValidUpdatedAtTimestamp(left.updatedAtTimestamp)
  const rightMissing = !right.isPlayed || !hasValidUpdatedAtTimestamp(right.updatedAtTimestamp)

  if (leftMissing && rightMissing) {
    return 0
  }

  if (leftMissing) {
    return 1
  }

  if (rightMissing) {
    return -1
  }

  return left.updatedAtTimestamp === right.updatedAtTimestamp
    ? 0
    : left.updatedAtTimestamp - right.updatedAtTimestamp
}
