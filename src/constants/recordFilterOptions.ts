import { localizedCopy } from '../i18n'
import type { PlayerRecordDTO } from '../types/api'
import type { ComboLampFilter } from '../types/record'

/** レコードフィルターの共通選択肢の表示文言 */
export const RECORD_FILTER_OPTIONS_COPY = localizedCopy('recordFilterOptions')
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
