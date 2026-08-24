import type { WorldsendRecordDTO } from '../../../../types/api'

export type {
  WorldsendAttribute,
  WorldsendFilterState,
  WorldsendLevelStar,
} from '../../../../types/worldsendRecord'

/** 楽曲マスタ由来の補足情報を付与した WORLD'S END レコード */
export interface WorldsendRecordWithSongMeta extends WorldsendRecordDTO {
  genre: string | null
  reading: string | null
  release: string | null
  release_version: string
}
