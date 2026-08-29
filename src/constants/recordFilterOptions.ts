import type { PlayerRecordDTO } from '../types/api'
import type { ComboLampFilter } from '../types/record'

/** 通常レコードで未解禁設定済みの楽曲・譜面を除外するフィルターの表示名 */
export const EXCLUDE_LOCKED_SONGS_FILTER_LABEL = '未解禁曲を除外'

// TODO: これらの定数がハードコードされていていいのか？サーバから取ってこなくていいのか？
/** 通常レコードと WORLD'S END レコードのコンボランプフィルター選択肢 */
export const RECORD_COMBO_LAMP_OPTIONS: ComboLampFilter[] = [
  'ALL JUSTICE CRITICAL',
  'ALL JUSTICE',
  'FULL COMBO',
  null,
]

/** 通常レコードと WORLD'S END レコードのチェインランプフィルター選択肢 */
export const RECORD_CHAIN_LAMP_OPTIONS: PlayerRecordDTO['full_chain'][] = [
  'FULL CHAIN PLATINUM',
  'FULL CHAIN GOLD',
  null,
]

/** 通常レコードと WORLD'S END レコードのハードランプフィルター選択肢 */
export const RECORD_HARD_LAMP_OPTIONS: PlayerRecordDTO['clear_lamp'][] = [
  'CATASTROPHY',
  'ABSOLUTE',
  'BRAVE',
  'HARD',
  'CLEAR',
  'FAILED',
  null,
]
