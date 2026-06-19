export interface ErrorResponse {
  error?: {
    status: number
    code: string
  }
}

/**
 * API ルートが返す公開メタ情報。
 */
export interface ApiRootResponse {
  /** API アプリケーション名。 */
  app_name: string
  /** API のビルド日時または開発環境識別子。 */
  build_date: string
  /** API の短縮コミットハッシュ。管理者向けレスポンスで返される。 */
  revision?: string
  /** API が返すバージョン番号。未設定の環境では省略される。 */
  version?: string
}

/**
 * GET /version が返すAPIバージョン情報。
 */
export interface ApiVersionResponse {
  /** API アプリケーション名。 */
  app_name: string
  /** API のビルド日時または開発環境識別子。 */
  build_date: string
  /** API の Git 短縮コミットハッシュ。 */
  commit_hash: string
  /** API バイナリの Go バージョン。 */
  go_version: string
}

/** キャッシュ更新判定 API が返す更新日時レスポンス。 */
export interface UpdatedAtResponseDTO {
  /** 対象データの最新更新日時。未登録の場合は null。 */
  updated_at: string | null
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
  | 'invalid_turnstile_token'
  | 'token_expired'
  | 'missing_token'
  | 'recent_sign_in_required'
  // 権限
  | 'forbidden'
  | 'firebase_uid_already_linked'
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
  // Record Filters
  | 'record_filter_not_found'
  | 'record_filter_limit_exceeded'
  | 'invalid_record_filter_input'
  | 'invalid_record_filter_id'
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
  invalid_turnstile_token: '認証確認に失敗しました。もう一度お試しください',
  token_expired: '認証トークンの有効期限が切れています',
  missing_token: '認証トークンが必要です',
  recent_sign_in_required: '再認証が必要です。もう一度Googleログインを行ってください',
  forbidden: 'アクセス権限がありません',
  firebase_uid_already_linked: 'このGoogleアカウントはすでに別のユーザーに連携されています',
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
  record_filter_not_found: '保存済みフィルターが見つかりません',
  record_filter_limit_exceeded: '保存済みフィルターの上限件数に達しています',
  invalid_record_filter_input: '保存済みフィルターの入力内容が不正です',
  invalid_record_filter_id: '保存済みフィルターIDが不正です',
  username_empty: 'ユーザー名が空です',
  username_too_short: 'ユーザー名は5文字以上である必要があります',
  username_too_long: 'ユーザー名は50文字以内である必要があります',
  username_invalid_char: 'ユーザー名は小文字英数字のみ使用できます',
  password_too_short: 'パスワードは8文字以上である必要があります',
  password_too_long: 'パスワードは128文字以内である必要があります',
  invalid_password: 'パスワードが無効です',
  app_version_unsupported: 'データが古くなっています',
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
  notes_designer?: string | null
  updated_at?: string | null
}

export interface SongDTO {
  id: string
  title: string
  reading: string | null
  artist: string
  genre: string
  bpm: number | null
  release: string | null
  official_idx?: string
  jacket: string | null
  maxop: number
  is_maxop_unknown: boolean
  /** 理論値OVER POWERが最大となる譜面の難易度。譜面がない場合は null。 */
  op_target_difficulty: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA' | null
  charts: {
    BASIC?: ChartDTO
    ADVANCED?: ChartDTO
    EXPERT?: ChartDTO
    MASTER?: ChartDTO
    ULTIMA?: ChartDTO
  }
}

export interface ManagedSongDTO extends SongDTO {
  is_deleted: boolean
  updated_at: string
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
  sort_order?: number
}

export interface RatingBandDTO {
  id: number
  label: string
  min_inclusive: number | null
  max_exclusive: number | null
  sort_order: number
}

export interface AchievementTypeDTO {
  code: string
  label?: string
  name?: string
}
export interface MasterDataDTO {
  genres: MasterItemDTO[]
  difficulties: MasterItemDTO[]
  versions: VersionDTO[]
  account_types: MasterItemDTO[]
  rating_bands: RatingBandDTO[]
  achievement_types: AchievementTypeDTO[]
}

export interface VersionDTO {
  id: number
  name: string
  released_at: string
}

export interface VersionSummaryDTO {
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
  diff?: number | number[]
  const?: {
    min?: number
    max?: number
  }
  genre?: number | number[]
  ver?: number | number[]
}

export type GoalAchievementParams =
  | {
      score: number
      count?: number
    }
  | {
      score: number
    }
  | {
      lamp: 'HRD' | 'BRV' | 'ABS' | 'CTS'
      count?: number
    }
  | {
      lamp: 'FC' | 'AJ'
      count?: number
    }
  | {
      total?: number
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

/** 保存済みレコードフィルターの対象種別。 */
export type RecordFilterType = 'standard' | 'worldsend'

/** API が返す保存済みレコードフィルター。 */
export interface RecordFilterDTO<TFilter = unknown> {
  id: string
  name: string
  filter_type: RecordFilterType
  schema_version: number
  filter: TFilter
  created_at: string
  updated_at: string
}

/** 保存済みレコードフィルターの作成・更新リクエスト。 */
export type RecordFilterRequest<TFilter = unknown> = Pick<
  RecordFilterDTO<TFilter>,
  'name' | 'filter_type' | 'schema_version' | 'filter'
>

/** 保存済みレコードフィルター一覧レスポンス。 */
export interface RecordFiltersResponse<TFilter = unknown> {
  filters: RecordFilterDTO<TFilter>[]
}

// --------------------------------

export type AccountType = 'PLAYER' | 'EDITOR' | 'ADMIN'

export interface UserDTO {
  username: string
  account_type: AccountType
  is_private: boolean
  last_score_update: string | null
}

export interface PlayerDataResult {
  player_id: number
  app_ver: string
  imported_at: string
  /** 登録後のプレイヤープロフィール情報。 */
  profile: PlayerDataProfile
  summary: PlayerDataSummary
  /** 登録後の通常譜面集計。 */
  statistics: PlayerDataStatistics
  counts: PlayerDataCounts
  /** 実際に新規追加または更新されたスコア差分。0件の場合は空配列。 */
  changes: PlayerDataRecordChange[]
  skipped_records: SkippedRecord[]
}

export interface PlayerDataProfile {
  player_id: number
  name: string
  level: number
  rating: number | null
  class_emblem_id: number | null
  class_emblem_base_id: number | null
  last_played_at: string | null
  overpower_value: number | null
  overpower_percent: number | null
}

export interface PlayerDataSummary {
  name: string
  level: number
  rating: number | null
  last_played_at: string | null
  overpower_value: number | null
  overpower_percentage: number | null
}

export interface PlayerDataStatistics {
  total_high_score: number
  lamp_counts: {
    clear: Record<string, number>
    combo: Record<string, number>
    full_chain: Record<string, number>
  }
}

export interface PlayerDataCounts {
  /** 通常譜面レコードの保存対象件数。 */
  standard_records_upserted: number
  /** WORLD'S END レコードの保存対象件数。 */
  worldsend_records_upserted: number
  /** 通常譜面レコードのスキップ件数。 */
  standard_records_skipped: number
  /** WORLD'S END レコードのスキップ件数。 */
  worldsend_records_skipped: number
  /** 称号データのスキップ件数。 */
  honors_skipped: number
  /** 通常譜面レコードの実更新件数。 */
  standard_records_actually_changed: number
  /** WORLD'S END レコードの実更新件数。 */
  worldsend_records_actually_changed: number
}

export interface PlayerDataRecordChange {
  /** 登録差分のレコード種別。 */
  record_type: 'standard' | 'worldsend'
  change_type: 'new' | 'updated'
  idx: string
  /** 通常譜面は大文字難易度名、WORLD'S ENDはWE。 */
  diff: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA' | 'WE'
  before: PlayerDataRecordState | null
  after: PlayerDataRecordState
}

export interface PlayerDataRecordState {
  score: number
  clear_lamp: string | null
  combo_lamp: string | null
  full_chain: string | null
}

export interface SkippedRecord {
  /** スキップされたレコード種別。 */
  record_type: 'standard' | 'worldsend' | 'honor'
  reason: string
  details: string
}

export interface UserProfileDTO {
  username: string
  player: PlayerDTO | null
}

export interface AdminUserListResponse {
  username: string
  firebase_uid?: string | null
  last_sign_in_time?: string | null
  last_refresh_time?: string | null
  account_type: 'ADMIN' | 'PLAYER'
  created_at: string
  updated_at: string
  player_name: string | null
  rating: number | null
  overpower_value: number | null
  is_suspicious: boolean
  is_private: boolean
}

export interface UserRatingMetaDTO {
  updated_at: string | null
}

export interface UserRatingDTO {
  best: PlayerRecordDTO[]
  best_candidate: PlayerRecordDTO[]
  new: PlayerRecordDTO[]
  new_candidate: PlayerRecordDTO[]
  meta: UserRatingMetaDTO
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

export interface AdminHonorDTO {
  id: number
  name: string
  type_name: string
  image_url: string
  created_at: string | null
}

export interface AdminHonorsResponse {
  honors: AdminHonorDTO[]
}

export interface HonorRequestDTO {
  name: string
  type_name: string
  image_url: string
}

export interface HonorTypesResponse {
  honor_types: MasterItemDTO[]
}

export interface UserRecordMetaDTO {
  updated_at: string | null
}

export interface UserRecordDTO {
  /** 通常譜面のユーザーレコード。 */
  standard: PlayerRecordDTO[]
  /** WORLD'S END のユーザーレコード。 */
  worldsend?: WorldsendRecordDTO[]
  meta: UserRecordMetaDTO
}

export interface PlayerLockedSongResponseItem {
  display_id: string
  title: string
  is_ultima: boolean
}

export interface PlayerLockedSongsResponse {
  items: PlayerLockedSongResponseItem[]
}

export interface PlayerLockedSongRequest {
  display_id: string
  is_ultima?: boolean
}

export interface PlayerLockedSongsBatchRequest {
  add?: PlayerLockedSongRequest[]
  delete?: PlayerLockedSongRequest[]
}

export interface UserProfileWithRecordsDTO {
  username: string
  player: PlayerDTO | null
  records: UserRecordDTO | null
  updated_at: string | null
}

export type LinkedUserProfileWithRecordsDTO = UserProfileWithRecordsDTO & {
  player: PlayerDTO
  records: UserRecordDTO
}

export interface UserRecordResponseDTO {
  updated_at: string
  best: PlayerRecordDTO[]
  best_candidate: PlayerRecordDTO[]
  new: PlayerRecordDTO[]
  new_candidate: PlayerRecordDTO[]
  /** 通常譜面のユーザーレコード。 */
  standard: PlayerRecordDTO[]
  /** WORLD'S END のユーザーレコード。 */
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
  /** AJ時のJUSTICE数。AJ以外または算出不能な場合はnull。 */
  justice_count: number | null
  /** OVER POWER達成率。 */
  overpower_percent: number
  img: string
  clear_lamp: 'FAILED' | 'CLEAR' | 'HARD' | 'BRAVE' | 'ABSOLUTE' | 'CATASTROPHY' | null
  combo_lamp: 'FULL COMBO' | 'ALL JUSTICE' | null
  full_chain: 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null
  slot: string | null
}

export interface WorldsendRecordDTO {
  is_played: boolean
  updated_at: string | null
  id: string
  title: string
  artist: string
  level_star: number | null
  attribute: string | null
  notes: number | null
  score: number
  /** AJ時のJUSTICE数。AJ以外または算出不能な場合はnull。 */
  justice_count: number | null
  img: string
  clear_lamp: 'FAILED' | 'CLEAR' | 'HARD' | 'BRAVE' | 'ABSOLUTE' | 'CATASTROPHY' | null
  combo_lamp: 'FULL COMBO' | 'ALL JUSTICE' | null
  full_chain: 'FULL CHAIN GOLD' | 'FULL CHAIN PLATINUM' | null
}

export interface WorldsendChartDTO {
  attribute: string | null
  level_star: number | null
  notes: number | null
  notes_designer?: string | null
  updated_at?: string | null
}

export interface WorldsendSongDTO {
  id: string
  title: string
  reading: string | null
  artist: string
  genre: string | null
  bpm: number | null
  release: string | null
  official_idx: string
  jacket: string | null
  charts: { WORLDSEND?: WorldsendChartDTO }
  // API仕様書に未記載だが include_deleted=true 時に削除状態の判別に利用
  is_deleted?: boolean
}

export interface ManagedWorldsendSongDTO extends WorldsendSongDTO {
  is_deleted: boolean
  updated_at: string
}

export interface UpdateChartRequestDTO {
  const: number
  is_const_unknown: boolean
  notes: number | null
  notes_designer?: string | null
}

export interface CreateSongChartRequestDTO {
  difficulty: 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA'
  const: number
  is_const_unknown: boolean
  notes: number | null
  notes_designer?: string | null
}

export interface CreateSongRequestDTO {
  official_idx: string
  title: string
  reading?: string | null
  artist: string
  genre: string
  bpm: number | null
  released_at: string | null
  jacket: string | null
  charts?: CreateSongChartRequestDTO[]
}

export interface UpdateSongRequestDTO {
  id: string
  title: string
  reading: string | null
  artist: string
  genre: string | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  charts: Record<string, UpdateChartRequestDTO>
}

export interface UpdateWorldsendChartRequestDTO {
  attribute: string | null
  level_star: number | null
  notes: number | null
  notes_designer?: string | null
}

export interface CreateWorldsendSongRequestDTO {
  official_idx: string
  title: string
  reading?: string | null
  artist: string
  genre: string
  bpm: number | null
  released_at: string | null
  jacket: string | null
  chart?: UpdateWorldsendChartRequestDTO
}

export interface UpdateWorldsendSongRequestDTO {
  id: string
  title: string
  reading: string | null
  artist: string
  genre: string | null
  bpm: number | null
  released_at: string | null
  jacket: string | null
  charts?: {
    WORLDSEND?: UpdateWorldsendChartRequestDTO
  } | null
}

// --------------------------------

export interface ApiTokenResponse {
  token: string
}

export interface ApiTokenStatusResponse {
  has_token: boolean
  created_at: string | null
}
