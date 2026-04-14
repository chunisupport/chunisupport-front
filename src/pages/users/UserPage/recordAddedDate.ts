const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/

export const formatRecordAddedDate = (updatedAt: string | null): string => {
  if (!updatedAt) return '-'

  const matched = updatedAt.match(DATE_PATTERN)
  if (!matched) return '-'

  const [, year, month, day] = matched
  return `${year.slice(-2)}/${month}/${day}`
}
