import type { WorldsendRecordDTO } from '../../../../types/api'

export type {
  WorldsendAttribute,
  WorldsendFilterState,
  WorldsendLevelStar,
} from '../../../../types/worldsendRecord'

/** 楽曲マスタ由来の補足情報を付与した WORLD'S END レコード */
export interface WorldsendRecordWithSongMeta extends WorldsendRecordDTO {
  genre: string | null
  /** 楽曲名順フォルダのコード。楽曲マスタにない場合は null */
  name_folder_code: string | null
  reading: string | null
  release: string | null
  release_version: string
}
