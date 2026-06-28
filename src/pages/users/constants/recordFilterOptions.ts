import type { PlayerRecordDTO } from '../../../types/api.ts'

// TODO: これらの定数がハードコードされていていいのか？サーバから取ってこなくていいのか？
/** 通常レコードと WORLD'S END レコードのコンボランプフィルター選択肢。 */
export const RECORD_COMBO_LAMP_OPTIONS: PlayerRecordDTO['combo_lamp'][] = [
  'ALL JUSTICE',
  'FULL COMBO',
  null,
]

/** 通常レコードと WORLD'S END レコードのチェインランプフィルター選択肢。 */
export const RECORD_CHAIN_LAMP_OPTIONS: PlayerRecordDTO['full_chain'][] = [
  'FULL CHAIN PLATINUM',
  'FULL CHAIN GOLD',
  null,
]

/** 通常レコードと WORLD'S END レコードのハードランプフィルター選択肢。 */
export const RECORD_HARD_LAMP_OPTIONS: PlayerRecordDTO['clear_lamp'][] = [
  'CATASTROPHY',
  'ABSOLUTE',
  'BRAVE',
  'HARD',
  'CLEAR',
  'FAILED',
  null,
]
