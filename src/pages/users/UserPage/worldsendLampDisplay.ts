import type { WorldsendRecordDTO } from '../../../types/api'

export const worldsendLampLabel = (record: WorldsendRecordDTO): string => {
  if (record.combo_lamp === 'ALL JUSTICE') return 'AJ'
  if (record.combo_lamp === 'FULL COMBO') return 'FC'
  return '-'
}

export const worldsendLampClass = (record: WorldsendRecordDTO): string => {
  if (record.combo_lamp === 'ALL JUSTICE') return 'bg-yellow-200 text-yellow-900'
  if (record.combo_lamp === 'FULL COMBO') return 'bg-orange-200 text-orange-900'
  return 'text-gray-500'
}
