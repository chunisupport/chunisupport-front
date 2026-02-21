export interface ErrorResponse {
  error?: {
    status: number
    code: string
  }
}

export type ErrorCode =
  // 汎用
  | 'bad_request'
  | 'internal_error'
  // 認証
  | 'unauthorized'
  | 'invalid_credentials'
  | 'invalid_recovery_credentials'
  | 'invalid_token'
  | 'token_expired'
  | 'missing_token'
  | 'invalid_session'
  // 権限
  | 'forbidden'
  // ユーザー
  | 'registration_failed'
  | 'user_not_found'
  | 'operation_failed'
  // プレイヤー
  | 'player_not_linked'
  | 'player_not_found'
  // 楽曲・譜面
  | 'song_not_found'
  | 'chart_not_found'
  | 'invalid_genre_id'
  | 'invalid_difficulty_id'
  | 'invalid_difficulty'
  // データ
  | 'validation_failed'
  | 'resource_not_found'
  | 'conflict'
  | 'api_token_not_found'
  | 'payload_too_large'
  // Goals
  | 'goal_not_found'
  | 'goal_limit_exceeded'
  | 'goal_invalid_title'
  | 'goal_invalid_achievement_type'
  | 'goal_invalid_achievement_params'
  | 'goal_invalid_attributes'
  | 'invalid_goal_input'
  // 入力検証
  | 'username_empty'
  | 'username_too_short'
  | 'username_too_long'
  | 'username_invalid_char'
  | 'password_too_short'
  | 'password_too_long'
  | 'invalid_password'
  | 'app_version_unsupported'
  // その他
  | 'not_found'
  | 'method_not_allowed'
  | 'unsupported_media_type'
  | 'too_many_requests'
  | 'service_unavailable'

export const errorMessages: Record<ErrorCode, string> = {
  bad_request: 'リクエスト形式が不正です',
  internal_error: 'サーバーエラーが発生しました',
  unauthorized: '認証が必要です',
  invalid_credentials: 'ユーザー名またはパスワードが正しくありません',
  invalid_recovery_credentials: 'リカバリーコードが無効または使用済みです',
  invalid_token: '認証トークンが無効です',
  token_expired: '認証トークンの有効期限が切れています',
  missing_token: '認証トークンが必要です',
  invalid_session: 'セッションが無効または期限切れです',
  forbidden: 'アクセス権限がありません',
  registration_failed: 'このユーザー名は使用できません',
  user_not_found: 'ユーザーが見つかりません',
  operation_failed: '操作に失敗しました',
  player_not_linked: 'プレイヤーデータが連携されていません',
  player_not_found: 'プレイヤーが見つかりません',
  song_not_found: '楽曲が見つかりません',
  chart_not_found: '譜面が見つかりません',
  invalid_genre_id: 'ジャンルIDが不正です',
  invalid_difficulty_id: '難易度IDが不正です',
  invalid_difficulty: '難易度の指定が不正です',
  validation_failed: '入力内容に誤りがあります',
  resource_not_found: 'データが見つかりません',
  conflict: 'データが競合しています',
  api_token_not_found: 'APIトークンが見つかりません',
  payload_too_large: 'データサイズが大きすぎます',
  goal_not_found: '目標が見つかりません',
  goal_limit_exceeded: '目標の上限件数に達しています',
  goal_invalid_title: '目標タイトルが不正です',
  goal_invalid_achievement_type: '目標種別が不正です',
  goal_invalid_achievement_params: '目標パラメータが不正です',
  goal_invalid_attributes: '目標条件が不正です',
  invalid_goal_input: '目標入力が不正です',
  username_empty: 'ユーザー名が空です',
  username_too_short: 'ユーザー名は5文字以上である必要があります',
  username_too_long: 'ユーザー名は50文字以内である必要があります',
  username_invalid_char: 'ユーザー名は小文字英数字のみ使用できます',
  password_too_short: 'パスワードは8文字以上である必要があります',
  password_too_long: 'パスワードは128文字以内である必要があります',
  invalid_password: 'パスワードが無効です',
  app_version_unsupported: 'データが古いため読み込めません',
  not_found: 'リソースが見つかりません',
  method_not_allowed: '許可されていない操作です',
  unsupported_media_type: 'サポートされていないメディアタイプです',
  too_many_requests: 'リクエストが多すぎます。しばらく待ってから再試行してください',
  service_unavailable: 'サービスが一時的に利用できません',
}

// エラーコードからメッセージを取得するヘルパー関数
export const getErrorMessage = (error: ErrorResponse): string => {
  const code = error.error?.code
  if (code && code in errorMessages) {
    return errorMessages[code as ErrorCode]
  }
  return 'エラーが発生しました'
}

export interface ChartDTO {
  const: number
  is_const_unknown: boolean
  notes: number | null
}

export interface SongDTO {
  id: string
  title: string
  artist: string
  genre: string
  bpm: number | null
  release: string | null
  jacket: string | null
  maxop: number
  is_maxop_unknown: boolean
  charts: {
    BASIC?: ChartDTO
    ADVANCED?: ChartDTO
    EXPERT?: ChartDTO
    MASTER?: ChartDTO
    ULTIMA?: ChartDTO
  }
}

// --- 楽曲統計用型定義 ---
export interface SongStatsRankDTO {
  aaal: number
  s: number
  sp: number
  ss: number
  ssp: number
  sss: number
  sssp: number
  max: number
}

export interface SongStatsComboDTO {
  none: number
  fc: number
  aj: number
}

export interface SongStatsClearDTO {
  failed: number
  clear: number
  hard: number
  brave: number
  absolute: number
  catastrophy: number
}

export interface SongStatsBandDTO {
  rating_band: string
  rank: SongStatsRankDTO
  combo: SongStatsComboDTO
  clear: SongStatsClearDTO
  average_score: number | null
  player_count: number
}

export interface SongStatsResponseDTO {
  song_id: string
  stats: SongStatsBandDTO[]
}

// --- マスターデータ用型定義 ---
export interface MasterItemDTO {
  id: number
  name: string
}

export interface BooleanChoiceDTO {
  value: boolean
  label: string
}

export interface MasterDataDTO {
  genres: MasterItemDTO[]
  difficulties: MasterItemDTO[]
  versions: VersionDTO[]
  is_const_unknown: BooleanChoiceDTO[]
  account_types: MasterItemDTO[]
}

export interface VersionDTO {
  id: number
  name: string
  released_at: string
}

export type GoalAchievementType =
  | 'rank_count'
  | 'score_count'
  | 'avg_score'
  | 'hardlamp_count'
  | 'combolamp_count'
  | 'total_score'
  | 'overpower_value'
  | 'overpower_percent'

export interface GoalAttributes {
  diff?: number
  const?: {
    min?: number
    max?: number
  }
  genre?: number
  ver?: number
}

export type GoalAchievementParams =
  | {
    score: number
    count: number
  }
  | {
    score: number
  }
  | {
    lamp: 'HRD' | 'BRV' | 'ABS' | 'CTS'
    count: number
  }
  | {
    lamp: 'FC' | 'AJ'
    count: number
  }
  | {
    total: number
  }

export interface GoalDTO {
  id: number
  title: string
  achievement_type: GoalAchievementType
  achievement_params: GoalAchievementParams
  attributes: GoalAttributes
  invert: boolean
  created_at: string
}

export type GoalCreateRequest = Omit<GoalDTO, 'id' | 'created_at'>
export type GoalUpdateRequest = Omit<GoalDTO, 'id' | 'created_at'>

// --------------------------------

export interface UserDTO {
  username: string
  player: PlayerDTO | null
  account_type?: 'PLAYER' | 'EDITOR' | 'ADMIN'
}

export interface UserProfileWithRecordsDTO {
  username: string
  player: PlayerDTO
  records: UserRecordResponseDTO
  updated_at: string
}

export interface PlayerDTO {
  name: string
  level: number
  rating: number
  class_emblem_id: number | null
  class_emblem_base_id: number | null
  last_played_at: string | null
  overpower_value: number | null
  overpower_percent: number | null
  team_name: string | null
  team_color: string | null
  honors: HonorDTO[]
  created_at: string
  updated_at: string
}

export interface HonorDTO {
  slot: 1 | 2 | 3
  name: string
  type_name:
  | 'normal'
  | 'copper'
  | 'silver'
  | 'gold'
  | 'platina'
  | 'rainbow'
  | 'staff'
  | 'ongeki'
  | 'maimai'
  | 'sp'
  | 'phoenix_g'
  | 'phoenix_p'
  | 'phoenix_r'
  | 'expert'
  | 'master'
  | 'ultima'
  image_url: string | null
}

export interface UserRecordResponseDTO {
  updated_at: string
  best: PlayerRecordDTO[]
  best_candidate: PlayerRecordDTO[]
  new: PlayerRecordDTO[]
  new_candidate: PlayerRecordDTO[]
  all: PlayerRecordDTO[]
  worldsend?: WorldsendRecordDTO[]
}

export interface PlayerRecordDTO {
  is_played: boolean
  updated_at: string | null
  difficulty: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA'
  id: string
  title: string
  artist: string
  const: number
  is_const_unknown: boolean
  // 補足: 未プレイデータの場合でも、score・rating・overpowerは0が返る仕様である。
  score: number
  rating: number
  overpower: number
  img: string
  clear_lamp: 'FAILED' | 'CLEAR' | 'HARD' | 'BRAVE' | 'ABSOLUTE' | 'CATASTROPHY' | null
  combo_lamp: 'FULL COMBO' | 'ALL JUSTICE' | null
  full_chain: 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null
  slot: string | null
}

export interface WorldsendRecordDTO {
  updated_at: string
  id: string
  title: string
  artist: string
  we_star: number | null // WORLD'S END 星の数（1～5）
  we_kanji: string | null // WORLD'S END カテゴリ漢字
  notes: number | null
  score: number
  img: string
  clear_lamp: 'FAILED' | 'CLEAR' | 'HARD' | 'BRAVE' | 'ABSOLUTE' | 'CATASTROPHY'
  combo_lamp: 'FULL COMBO' | 'ALL JUSTICE' | null
  full_chain: 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null
}

// --------------------------------

export interface SessionCountResponse {
  count: number
}

export interface RecoveryCodesResponse {
  recovery_codes: string[]
}

export interface ApiTokenResponse {
  token: string
}
