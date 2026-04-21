import type { PlayerRecordDTO } from '../../types/api'

const DIFFICULTY_QUERY_TO_API: Record<string, PlayerRecordDTO['difficulty']> = {
  basic: 'BASIC',
  advanced: 'ADVANCED',
  expert: 'EXPERT',
  master: 'MASTER',
  ultima: 'ULTIMA',
}

export const resolveSongPersonalBest = (
  records: readonly PlayerRecordDTO[],
  displayId: string,
  difficulty: string
): PlayerRecordDTO | undefined => {
  const normalizedDifficulty = DIFFICULTY_QUERY_TO_API[difficulty.toLowerCase()]
  if (!normalizedDifficulty) return undefined

  return records.find(
    (record) =>
      record.id === displayId &&
      record.difficulty === normalizedDifficulty &&
      record.is_played &&
      typeof record.score === 'number' &&
      record.score > 0
  )
}
