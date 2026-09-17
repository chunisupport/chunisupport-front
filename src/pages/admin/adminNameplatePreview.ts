import type { HonorDTO, PlayerDTO, UserRatingDTO } from '../../types/api'

const PREVIEW_HONORS: HonorDTO[] = [
  { slot: 1, name: '称号サンプル', type_name: 'gold', image_url: null },
  { slot: 2, name: 'シルバー称号', type_name: 'silver', image_url: null },
  { slot: 3, name: 'レインボー称号', type_name: 'rainbow', image_url: null },
]

/** ポゼッション確認用のダミープレイヤー */
export const NAMEPLATE_PREVIEW_PLAYER: PlayerDTO = {
  name: 'PLAYER',
  level: 25,
  rating: 16.5,
  class_emblem_id: null,
  class_emblem_base_id: null,
  possession_id: 1,
  last_played_at: null,
  overpower_value: 12_345.678,
  overpower_percent: 12.34567,
  team_name: null,
  team_color: null,
  honors: PREVIEW_HONORS,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

/** ポゼッション確認用のダミー称号 */
export const NAMEPLATE_PREVIEW_HONORS = PREVIEW_HONORS

/** ポゼッション確認用のダミーレーティング */
export const NAMEPLATE_PREVIEW_RATING: UserRatingDTO = {
  rating: 16.5,
  best_average: 16.21,
  new_average: 16.84,
  best: [],
  best_candidate: [],
  new: [],
  new_candidate: [],
  meta: { updated_at: null },
}
