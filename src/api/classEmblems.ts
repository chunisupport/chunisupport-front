import type { MasterItemDTO } from '../types/api'
import { fetchMasterData } from './songs'

/** クラスエンブレム本体と台座のマスタ */
export type ClassEmblemMasters = {
  emblems: MasterItemDTO[]
  bases: MasterItemDTO[]
}

/**
 * クラスエンブレム本体と台座のマスタを取得する。
 *
 * @returns キャッシュ済みマスターデータに含まれるクラスエンブレムとその台座（ID順）。
 */
export const fetchClassEmblems = async (): Promise<ClassEmblemMasters> => {
  const masterData = await fetchMasterData()
  return {
    emblems: masterData.class_emblems ?? [],
    bases: masterData.class_emblem_bases ?? [],
  }
}
