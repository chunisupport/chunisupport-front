export const formatPlayerUpdatedAt = (playerUpdatedAt: string | null): string => {
  if (!playerUpdatedAt) return '-'

  const date = new Date(playerUpdatedAt)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo',
  })
}
