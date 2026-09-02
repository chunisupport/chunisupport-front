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
  /** API アプリケーション名 */
  app_name: string
  /** API のビルド日時または開発環境識別子 */
  build_date: string
  /** API の短縮コミットハッシュ。管理者向けレスポンスで返される */
  revision?: string
  /** API が返すバージョン番号。未設定の環境では省略される */
  version?: string
}

/**
 * GET /version が返すAPIバージョン情報。
 */
export interface ApiVersionResponse {
  /** API アプリケーション名 */
  app_name: string
  /** API のビルド日時または開発環境識別子 */
  build_date: string
  /** API の Git 短縮コミットハッシュ */
  commit_hash: string
  /** API バイナリの Go バージョン */
  go_version: string
}

/** キャッシュ更新判定 API が返す更新日時レスポンス */
export interface UpdatedAtResponseDTO {
  /** 対象データの最新更新日時。未登録の場合は null */
  updated_at: string | null
}

/** APIが返すシステムの運用状態 */
export type SystemStatus = 'operational' | 'maintenance'

/** GET /internal/system/status が返すシステム状態 */
export interface SystemStatusDTO {
  /** 現在の運用状態 */
  status: SystemStatus
  /** メンテナンス中に一般利用者へ表示するコメント。通常稼働中は空文字 */
  comment: string
  /** 状態を最後に更新した日時 */
  updated_at: string
}

/** PUT /internal/admin/maintenance に送信する状態更新内容 */
export interface UpdateMaintenanceRequest {
  /** メンテナンスを有効にする場合は true */
  enabled: boolean
  /** 有効化時に一般利用者へ表示するコメント。無効化時は空文字 */
  comment: string
}

/** APIが返すエラーコード */
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
  | 'player_metric_history_not_found'
  // ユーザーデータ移行
  | 'data_transfer_player_not_found'
  | 'data_transfer_invalid_file'
  | 'data_transfer_invalid_signature'
  | 'data_transfer_unsupported_schema'
  | 'data_transfer_invalid_data'
  | 'data_transfer_unresolved_reference'
  | 'data_transfer_destination_not_empty'
  // 楽曲・譜面
  | 'song_not_found'
  | 'chart_not_found'
  | 'invalid_genre_id'
  | 'invalid_difficulty_id'
  | 'invalid_difficulty'
  | 'score_history_not_found'
  | 'score_history_unsupported_difficulty'
  // データ
  | 'validation_failed'
  | 'resource_not_found'
  | 'conflict'
  | 'api_token_not_found'
  | 'api_token_limit_exceeded'
  | 'api_token_name_conflict'
  | 'invalid_api_token_name'
  | 'invalid_api_token_id'
  | 'payload_too_large'
  // Goals
  | 'goal_not_found'
  | 'goal_limit_exceeded'
  | 'goal_invalid_title'
  | 'goal_invalid_achievement_type'
  | 'goal_invalid_achievement_params'
  | 'goal_invalid_attributes'
  | 'goal_invalid_order'
  | 'invalid_goal_input'
  | 'goal_group_not_found'
  | 'goal_group_limit_exceeded'
  | 'goal_group_invalid_name'
  | 'goal_group_conflict'
  | 'goal_group_invalid_order'
  // Record Filters
  | 'record_filter_not_found'
  | 'record_filter_limit_exceeded'
  | 'invalid_record_filter_input'
  | 'invalid_record_filter_id'
  // Friends
  | 'friendship_limit_exceeded'
  | 'friendship_conflict'
  | 'friend_request_not_found'
  | 'favorite_song_limit_exceeded'
  // 入力検証
  | 'username_empty'
  | 'username_too_short'
  | 'username_too_long'
  | 'username_invalid_char'
  | 'username_forbidden'
  | 'username_taken'
  | 'password_too_short'
  | 'password_too_long'
  | 'invalid_password'
  | 'app_version_unsupported'
  | 'duplicate_official_idx'
  // その他
  | 'not_found'
  | 'method_not_allowed'
  | 'unsupported_media_type'
  | 'too_many_requests'
  | 'service_unavailable'
  | 'maintenance_mode'

/** APIエラーコードに対応する利用者向けメッセージ */
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
  player_metric_history_not_found: 'RATING・OVER POWER・OP%履歴が見つかりません',
  data_transfer_player_not_found: 'エクスポートできるプレイヤーデータがありません',
  data_transfer_invalid_file: '選択した移行ファイルを読み込めません',
  data_transfer_invalid_signature: '移行ファイルの署名を確認できません',
  data_transfer_unsupported_schema: 'この移行ファイル形式には対応していません',
  data_transfer_invalid_data: '移行ファイル内のデータが不正です',
  data_transfer_unresolved_reference: '移行先で参照できないデータが含まれています',
  data_transfer_destination_not_empty: '移行先アカウントには既に対象データがあります',
  song_not_found: '楽曲が見つかりません',
  chart_not_found: '譜面が見つかりません',
  invalid_genre_id: 'ジャンルIDが不正です',
  invalid_difficulty_id: '難易度IDが不正です',
  invalid_difficulty: '難易度の指定が不正です',
  score_history_not_found: 'スコア履歴が見つかりません',
  score_history_unsupported_difficulty: 'スコア履歴に対応していない難易度です',
  validation_failed: '入力内容に誤りがあります',
  resource_not_found: 'データが見つかりません',
  conflict: 'データが競合しています',
  api_token_not_found: 'APIトークンが見つかりません',
  api_token_limit_exceeded: 'APIトークンの発行上限に達しています',
  api_token_name_conflict: '同じ名前のAPIトークンがすでに存在します',
  invalid_api_token_name: 'APIトークン名は1〜50文字で入力してください',
  invalid_api_token_id: 'APIトークンの指定が不正です',
  payload_too_large: 'データサイズが大きすぎます',
  goal_not_found: '目標が見つかりません',
  goal_limit_exceeded: '目標の上限件数に達しています',
  goal_invalid_title: '目標タイトルが不正です',
  goal_invalid_achievement_type: '目標種別が不正です',
  goal_invalid_achievement_params: '目標パラメータが不正です',
  goal_invalid_attributes: '目標条件が不正です',
  goal_invalid_order: '目標の並び順が不正です',
  invalid_goal_input: '目標入力が不正です',
  goal_group_not_found: '目標グループが見つかりません',
  goal_group_limit_exceeded: '目標グループの上限件数に達しています',
  goal_group_invalid_name: '目標グループ名が不正です',
  goal_group_conflict: '同じ名前の目標グループがすでに存在します',
  goal_group_invalid_order: '目標グループの並び順が不正です',
  record_filter_not_found: '保存済みフィルターが見つかりません',
  record_filter_limit_exceeded: '保存済みフィルターの上限件数に達しています',
  invalid_record_filter_input: '保存済みフィルターの入力内容が不正です',
  invalid_record_filter_id: '保存済みフィルターIDが不正です',
  friendship_limit_exceeded: 'フレンド枠の上限に達しています',
  friendship_conflict: '既に申請中、またはフレンドになっています',
  friend_request_not_found: '対象のフレンド申請が見つかりません',
  favorite_song_limit_exceeded: 'お気に入り楽曲の上限件数に達しています',
  username_empty: 'ユーザーネームが空です',
  username_too_short: 'ユーザーネームは5文字以上である必要があります',
  username_too_long: 'ユーザーネームは50文字以内である必要があります',
  username_invalid_char: 'ユーザーネームは小文字英数字のみ使用できます',
  username_forbidden: 'このユーザーネームは使用できません',
  username_taken: 'このユーザーネームはすでに使用されています',
  password_too_short: 'パスワードは8文字以上である必要があります',
  password_too_long: 'パスワードは128文字以内である必要があります',
  invalid_password: 'パスワードが無効です',
  app_version_unsupported: 'データが古くなっています',
  duplicate_official_idx: '同じ公式IDの楽曲がすでに存在します',
  not_found: 'リソースが見つかりません',
  method_not_allowed: '許可されていない操作です',
  unsupported_media_type: 'サポートされていないメディアタイプです',
  too_many_requests: 'リクエストが多すぎます。しばらく待ってから再試行してください',
  service_unavailable: 'サービスが一時的に利用できません',
  maintenance_mode: '現在メンテナンス中です',
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
  /** 理論値OVER POWERが最大となる譜面の難易度。譜面がない場合は null */
  op_target_difficulty: PlayerDataDifficulty | null
  /** 最新の2週間ごとの更新で追加された楽曲かどうか */
  is_new: boolean
  /** 難易度別譜面。APIは存在しない難易度をnullで返す場合がある */
  charts: Partial<Record<PlayerDataDifficulty, ChartDTO | null>>
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
  /** ALL JUSTICE CRITICALを達成したプレイヤー数 */
  ajc: number
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
  /** レーティング帯別の中央値スコア。集計対象がない場合はnull */
  median_score: number | null
  player_count: number
}

export interface SongStatsResponseDTO {
  song_id: string
  stats: SongStatsBandDTO[]
}

/** スコア履歴の1件を表す */
export interface ScoreHistoryEntryDTO {
  score: number
  clear_lamp: PlayerRecordDTO['clear_lamp']
  combo_lamp: PlayerRecordDTO['combo_lamp']
  full_chain: PlayerRecordDTO['full_chain']
  updated_at: string
}

/** 譜面単位のスコア履歴レスポンス */
export interface ScoreHistoryResponseDTO {
  entries: ScoreHistoryEntryDTO[]
}

/** フレンドランキングの対象楽曲概要 */
export interface FriendRankingSongDTO {
  /** 楽曲表示ID */
  id: string
  /** 楽曲名 */
  title: string
  /** アーティスト名 */
  artist: string
}

/** フレンドランキングの対象譜面概要 */
export interface FriendRankingChartDTO {
  /** 大文字の難易度ドメイン値 */
  difficulty: PlayerDataDifficulty
  /** 譜面定数 */
  const: number
  /** 譜面定数が推定値か */
  is_const_unknown: boolean
}

/** フレンドランキング1行分の現在スコア */
export interface FriendRankingEntryDTO {
  /** 同点を考慮した順位 */
  rank: number
  /** ユーザー名 */
  username: string
  /** プレイヤー名 */
  player_name: string
  /** 現在スコア */
  score: number
  /** 単曲レーティング */
  rating: number
  /** OVER POWER値 */
  overpower: number
  /** OVER POWER達成率 */
  overpower_percent: number
  /** クリアランプ */
  clear_lamp: PlayerRecordDTO['clear_lamp']
  /** コンボランプ */
  combo_lamp: PlayerRecordDTO['combo_lamp']
  /** フルチェインランプ */
  full_chain: PlayerRecordDTO['full_chain']
  /** レコード更新日時 */
  updated_at: string
  /** ログインユーザー自身の行か */
  is_self: boolean
}

/** 通常譜面のフレンドランキングレスポンス */
export interface FriendRankingResponseDTO {
  /** 対象楽曲 */
  song: FriendRankingSongDTO
  /** 対象譜面 */
  chart: FriendRankingChartDTO
  /** 自分とフレンドのランキング */
  ranking: FriendRankingEntryDTO[]
  /** 自分の順位。未プレイの場合は null */
  my_rank: number | null
  /** ランキング対象人数 */
  total: number
}

/** WORLD'S ENDのフレンドランキング1行分 */
export interface WorldsendFriendRankingEntryDTO {
  /** 同点を考慮した順位 */
  rank: number
  /** ユーザー名 */
  username: string
  /** プレイヤー名 */
  player_name: string
  /** 現在スコア */
  score: number
  /** クリアランプ */
  clear_lamp: WorldsendRecordDTO['clear_lamp']
  /** コンボランプ */
  combo_lamp: WorldsendRecordDTO['combo_lamp']
  /** フルチェインランプ */
  full_chain: WorldsendRecordDTO['full_chain']
  /** ログインユーザー自身の行か */
  is_self: boolean
}

/** WORLD'S ENDのフレンドランキングレスポンス */
export interface WorldsendFriendRankingResponseDTO {
  /** 自分とフレンドのランキング */
  ranking: WorldsendFriendRankingEntryDTO[]
  /** 自分の順位。未プレイの場合は null */
  my_rank: number | null
  /** ランキング対象人数 */
  total: number
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

/** ベスト枠ランキングに表示する楽曲概要 */
export interface BestSlotRankingSongDTO {
  id: string
  title: string
}

/** ベスト枠ランキングに表示する譜面概要 */
export interface BestSlotRankingChartDTO {
  difficulty: PlayerDataDifficulty
  const: number
  is_const_unknown: boolean
}

/** ベスト枠採用率ランキングの1件 */
export interface BestSlotRankingEntryDTO {
  rank: number
  song: BestSlotRankingSongDTO
  chart: BestSlotRankingChartDTO
  best_player_count: number
  best_player_percentage: number
  /** 選択レート帯でこの譜面をプレイした全プレイヤーの平均スコア */
  average_score: number | null
}

/** ベスト枠平均レート帯別ランキングAPIのレスポンス */
export interface BestSlotRankingResponseDTO {
  rating_band: string
  eligible_player_count: number
  ranking: BestSlotRankingEntryDTO[]
  next_cursor: string | null
}

/** 管理者向け譜面ランキングの楽曲情報 */
export interface AdminChartRankingSongDTO {
  id: string
  title: string
  artist: string
}

/** 管理者向け譜面ランキングの譜面情報 */
export interface AdminChartRankingChartDTO {
  difficulty: PlayerDataDifficulty | "WORLD'S END"
  const?: number
  is_const_unknown?: boolean
  level_star?: number
  attribute?: string
  is_worldsend: boolean
}

/** 管理者向け譜面ランキングの1件 */
export interface AdminChartRankingEntryDTO {
  rank: number
  username: string
  player_name: string
  score: number
  rating?: number
  overpower?: number
  overpower_percent?: number
  clear_lamp: PlayerRecordDTO['clear_lamp']
  combo_lamp: PlayerRecordDTO['combo_lamp']
  full_chain: PlayerRecordDTO['full_chain']
  updated_at: string
}

/** 管理者向け譜面ランキングAPIのレスポンス */
export interface AdminChartRankingResponseDTO {
  song: AdminChartRankingSongDTO
  chart: AdminChartRankingChartDTO
  ranking: AdminChartRankingEntryDTO[]
  total: number
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
  | 'fullchain_count'
  | 'rainbow_count'
  | 'total_score'
  | 'overpower_value'
  | 'overpower_percent'

export interface GoalAttributes {
  diff?: number | number[]
  chart_target?: 'OP_TARGET'
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
      remaining?: number
      percent?: number
    }
  | {
      score: number
    }
  | {
      lamp: 'HRD' | 'BRV' | 'ABS' | 'CTS'
      count?: number
      remaining?: number
      percent?: number
    }
  | {
      lamp: 'FC' | 'AJ'
      count?: number
      remaining?: number
      percent?: number
    }
  | {
      lamp: 'GOLD' | 'PLATINUM'
      count?: number
      remaining?: number
      percent?: number
    }
  | {
      count?: number
      remaining?: number
      percent?: number
    }
  | {
      total?: number
      remaining?: number
      percent?: number
    }

export interface GoalDTO {
  id: number
  group_id: number | null
  title: string
  achievement_type: GoalAchievementType
  achievement_params: GoalAchievementParams
  attributes: GoalAttributes
  /** 現在値を目標までの残量として表示するか */
  invert_value: boolean
  /** 達成率を残り割合として表示するか */
  invert_percentage: boolean
  sort_order: number
  created_at: string
}

export type GoalCreateRequest = Omit<GoalDTO, 'id' | 'sort_order' | 'created_at'>
export type GoalUpdateRequest = Omit<GoalDTO, 'id' | 'sort_order' | 'created_at'>

/** API が返す目標グループ */
export interface GoalGroupDTO {
  id: number
  name: string
  sort_order: number
  created_at: string
}

/** 目標グループの作成・更新リクエスト */
export interface GoalGroupRequest {
  name: string
}

// --------------------------------

/** 保存済みレコードフィルターの対象種別 */
export type RecordFilterType = 'standard' | 'worldsend'

/** API が返す保存済みレコードフィルター */
export interface RecordFilterDTO<TFilter = unknown> {
  id: string
  name: string
  filter_type: RecordFilterType
  schema_version: number
  filter: TFilter
  created_at: string
  updated_at: string
}

/** 保存済みレコードフィルターの作成・更新リクエスト */
export type RecordFilterRequest<TFilter = unknown> = Pick<
  RecordFilterDTO<TFilter>,
  'name' | 'filter_type' | 'schema_version' | 'filter'
>

/** 保存済みレコードフィルター一覧レスポンス */
export interface RecordFiltersResponse<TFilter = unknown> {
  filters: RecordFilterDTO<TFilter>[]
}

// --------------------------------

/** APIが返すアカウント種別 */
export type AccountType = 'PLAYER' | 'EDITOR' | 'ADMIN' | 'EXTDEV'

export interface UserDTO {
  username: string
  account_type: AccountType
  is_private: boolean
  last_score_update: string | null
}

/** フレンド・申請一覧に表示する相手ユーザー概要 */
export interface FriendshipUserDTO {
  /** ユーザー名。プロフィール遷移に使用する公開ID */
  username: string
  /** プレイヤーレベル。プレイヤーデータ未連携の場合は null */
  player_level: number | null
  /** プレイヤー名。プレイヤーデータ未連携の場合は null */
  player_name: string | null
  /** 計算済みレーティング。プレイヤーデータ未連携の場合は null */
  rating: number | null
  /** 非公開アカウントかどうか */
  is_private: boolean
  /** 申請日時 */
  requested_at: string
  /** 承認日時。申請中の場合は null または未返却 */
  accepted_at?: string | null
}

/** フレンド・申請一覧APIのレスポンス */
export interface FriendshipListResponse {
  /** フレンドまたは申請ユーザー概要の一覧 */
  items: FriendshipUserDTO[]
}

/** フレンド申請APIのリクエスト */
export interface FriendRequestCreateRequest {
  /** 完全一致で検索する申請先ユーザー名 */
  username: string
}

/** 登録直後と保存済み最新結果で共通するプレイヤーデータ更新結果 */
export interface PlayerDataUpdateResult {
  player_id: number
  app_ver: string
  imported_at: string
  /** 登録後のプレイヤープロフィール情報 */
  profile: PlayerDataProfile
  summary: PlayerDataSummary
  /** 登録前後のレート・OVER POWER値・OP%差分。schema version 1では未返却 */
  metric_diffs?: PlayerDataMetricDiffs
  /** 登録前後の通常譜面およびWORLD'S END集計差分 */
  statistics: PlayerDataStatistics
  counts: PlayerDataCounts
  /** 実際に新規追加または更新されたスコア差分。0件の場合は空配列 */
  changes: PlayerDataRecordChange[]
}

/** プレイヤーデータ登録APIが返す更新結果 */
export interface PlayerDataResult extends PlayerDataUpdateResult {
  skipped_records: SkippedRecord[]
}

/** 保存済みの最新プレイヤーデータ更新結果 */
export interface PlayerLatestUpdateResult extends PlayerDataUpdateResult {
  /** 保存形式のスキーマバージョン */
  schema_version: number
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

export type PlayerDataDifficulty = 'BASIC' | 'ADVANCED' | 'EXPERT' | 'MASTER' | 'ULTIMA'

/** 更新差分の統計グループとして返る通常難易度とWORLD'S END */
export type PlayerDataStatisticsDifficulty = PlayerDataDifficulty | 'WE'

/** 登録前後のnullableな小数差分 */
export interface PlayerDataFloat64Diff {
  before: number | null
  after: number | null
  delta: number | null
}

/** レート、OVER POWER値、OP%の登録前後差分 */
export interface PlayerDataMetricDiffs {
  rating: PlayerDataFloat64Diff
  overpower_value: PlayerDataFloat64Diff
  /** OP%の差分。schema version 1、2では未返却 */
  overpower_percent?: PlayerDataFloat64Diff
}

/** 登録前後の整数差分 */
export interface PlayerDataNumberDiff {
  before: number
  after: number
  delta: number
}

/** 通常譜面の達成件数差分 */
export interface PlayerDataRecordStatisticsDiff {
  aj: PlayerDataNumberDiff
  fc: PlayerDataNumberDiff
  clr: PlayerDataNumberDiff
  fch: PlayerDataNumberDiff
  max: PlayerDataNumberDiff
  sss_plus: PlayerDataNumberDiff
  sss: PlayerDataNumberDiff
  ss_plus: PlayerDataNumberDiff
  ss: PlayerDataNumberDiff
  s_plus: PlayerDataNumberDiff
  s: PlayerDataNumberDiff
}

/** 全体、通常難易度、またはWORLD'S ENDの集計差分 */
export interface PlayerDataStatisticsGroup {
  total_high_score: PlayerDataNumberDiff
  record_statistics: PlayerDataRecordStatisticsDiff
}

/** 通常譜面全体、固定5難易度、およびWORLD'S ENDの集計差分 */
export interface PlayerDataStatistics {
  overall: PlayerDataStatisticsGroup
  by_difficulty: Record<PlayerDataStatisticsDifficulty, PlayerDataStatisticsGroup>
}

export interface PlayerDataCounts {
  /** 通常譜面レコードの保存対象件数 */
  standard_records_upserted: number
  /** WORLD'S END レコードの保存対象件数 */
  worldsend_records_upserted: number
  /** 通常譜面レコードのスキップ件数 */
  standard_records_skipped: number
  /** WORLD'S END レコードのスキップ件数 */
  worldsend_records_skipped: number
  /** 称号データのスキップ件数 */
  honors_skipped: number
  /** 通常譜面レコードの実更新件数 */
  standard_records_actually_changed: number
  /** WORLD'S END レコードの実更新件数 */
  worldsend_records_actually_changed: number
  /** コースレコードの保存対象件数 */
  course_records_upserted: number
  /** コースレコードのスキップ件数 */
  course_records_skipped: number
  /** コースレコードの実更新件数 */
  course_records_actually_changed: number
}

/** 通常譜面・WORLD'S ENDの登録差分 */
export interface PlayerDataSongRecordChange {
  /** 登録差分のレコード種別 */
  record_type: 'standard' | 'worldsend'
  change_type: 'new' | 'updated'
  idx: string
  /** 通常譜面は大文字難易度名、WORLD'S ENDはWE */
  diff: PlayerDataDifficulty | 'WE'
  before: PlayerDataRecordState | null
  after: PlayerDataRecordState
}

/** コースレコードの登録差分 */
export interface PlayerDataCourseRecordChange {
  /** 登録差分のレコード種別 */
  record_type: 'course'
  change_type: 'new' | 'updated'
  /** コースの公式インデックス */
  idx: string
  /** コースクラス */
  course_class: string
  before: PlayerDataCourseRecordState | null
  after: PlayerDataCourseRecordState
}

/** コースマスタの表示に必要な情報 */
export interface CourseDTO {
  /** コースの表示用ID */
  display_id: string
  /** コースの公式インデックス */
  idx: string
  /** コースタイトル */
  name: string
  /** コースクラス */
  class: string
}

/** プレイヤーデータ登録で返されるレコード差分 */
export type PlayerDataRecordChange = PlayerDataSongRecordChange | PlayerDataCourseRecordChange

/** 通常譜面・WORLD'S ENDの差分状態 */
export interface PlayerDataRecordState {
  score: number
  clear_lamp: string | null
  combo_lamp: string | null
  full_chain: string | null
}

/** ハード・フルチェインを持たないコースレコードの差分状態 */
export interface PlayerDataCourseRecordState {
  score: number
  is_clear: boolean
  combo_lamp: string | null
}

export interface SkippedRecord {
  /** スキップされたレコード種別 */
  record_type: 'standard' | 'worldsend' | 'course' | 'honor'
  reason: string
  details: string
}

export interface UserProfileDTO {
  username: string
  player: PlayerDTO | null
}

/** 管理者向けユーザー一覧APIが返すユーザー情報 */
export interface AdminUserListResponse {
  username: string
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

/** 管理者向けユーザー集計APIが返す件数 */
export interface AdminUserStatisticsResponse {
  /** 全ユーザー数 */
  total_users: number
  /** プレイヤーデータが紐付けられているユーザー数 */
  users_with_player_data: number
  /** 直近30日以内に更新されたプレイヤーデータ数 */
  active_player_data_last_30_days: number
}

export interface UserRatingMetaDTO {
  updated_at: string | null
}

export interface UserRatingDTO {
  rating: number | null
  best_average: number | null
  new_average: number | null
  best: PlayerRecordDTO[]
  best_candidate: PlayerRecordDTO[]
  new: PlayerRecordDTO[]
  new_candidate: PlayerRecordDTO[]
  meta: UserRatingMetaDTO
}

/** 公式RATING・公式OVER POWER・公式OP%履歴の1件を表す */
export interface PlayerMetricHistoryEntryDTO {
  /** CHUNITHM-NETから取得した公式RATING */
  rating: number
  /** CHUNITHM-NETから取得した公式OVER POWER */
  overpower: number
  /** CHUNITHM-NETから取得した公式OP%。記録開始前はnull */
  overpower_percent: number | null
  /** CHUNITHM-NETからのデータ取得完了日時 */
  data_collected_at: string
}

/** プレイヤー単位の公式RATING・公式OVER POWER・公式OP%履歴レスポンス */
export interface PlayerMetricHistoryResponseDTO {
  /** 現在値を先頭に新しい順で並んだ公式指標のスナップショット */
  entries: PlayerMetricHistoryEntryDTO[]
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
  /** 通常譜面のユーザーレコード */
  standard: PlayerRecordDTO[]
  /** WORLD'S END のユーザーレコード */
  worldsend?: WorldsendRecordDTO[]
  meta: UserRecordMetaDTO
}

/** 通常楽曲1曲分のユーザーレコードレスポンス */
export interface UserStandardSongRecordDTO {
  standard: PlayerRecordDTO[]
  meta: UserRecordMetaDTO
}

/** WORLD'S END楽曲1曲分のユーザーレコードレスポンス */
export interface UserWorldsendSongRecordDTO {
  worldsend: WorldsendRecordDTO | null
  meta: UserRecordMetaDTO
}

/** コースモード1件分のユーザーレコード */
export interface CourseRecordDTO {
  /** コースの表示用ID */
  display_id: string
  /** コースの公式インデックス */
  idx: string
  /** コースタイトル */
  name: string
  /** コースクラス */
  class: string
  /** プレイ済みか */
  is_played: boolean
  /** 3曲合計スコア */
  score: number
  /** コースをクリア済みか */
  is_clear: boolean
  /** コースのコンボランプ */
  combo_lamp: 'FULL COMBO' | 'ALL JUSTICE' | null
  /** レコード更新日時 */
  updated_at: string | null
}

/** ユーザーのコースレコード一覧レスポンス */
export interface UserCourseRecordsDTO {
  courses: CourseRecordDTO[]
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

/** ユーザーがお気に入りに登録した楽曲 */
export interface PlayerFavoriteSongResponseItem {
  display_id: string
  title: string
  jacket: string | null
  favorited_at: string
}

/** お気に入り楽曲一覧APIのレスポンス */
export interface PlayerFavoriteSongsResponse {
  items: PlayerFavoriteSongResponseItem[]
}

/** お気に入り楽曲登録APIのリクエスト */
export interface PlayerFavoriteSongRequest {
  display_id: string
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
  /** 通常譜面のユーザーレコード */
  standard: PlayerRecordDTO[]
  /** WORLD'S END のユーザーレコード */
  worldsend?: WorldsendRecordDTO[]
}

export interface PlayerRecordDTO {
  is_played: boolean
  /** 曲ごとの現在OVER POWER集計対象か。楽曲マスタ上の理論値対象譜面ではない */
  is_op_target: boolean
  updated_at: string | null
  difficulty: PlayerDataDifficulty
  id: string
  title: string
  artist: string
  const: number
  is_const_unknown: boolean
  // 補足: 未プレイデータの場合でも、score・rating・overpowerは0が返る仕様である。
  score: number
  rating: number
  overpower: number
  /** AJ時のJUSTICE数。AJ以外または算出不能な場合はnull */
  justice_count: number | null
  /** OVER POWER達成率 */
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
  /** AJ時のJUSTICE数。AJ以外または算出不能な場合はnull */
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
  difficulty: PlayerDataDifficulty
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
  /** 最新の2週間ごとの更新で追加された楽曲かどうか。省略時はfalse */
  is_new?: boolean
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
  /** 最新の2週間ごとの更新で追加された楽曲かどうか。省略またはnullの場合はfalseとして更新 */
  is_new?: boolean | null
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

/** 移行対象に含まれるセクション別データ件数 */
export interface DataTransferCountsResponse {
  records: number
  record_histories: number
  worldsend_records: number
  worldsend_record_histories: number
  metric_histories: number
  course_records: number
  honors: number
  favorite_songs: number
  locked_songs: number
  goal_groups: number
  goals: number
  record_filters: number
}

/** 移行を確定できない理由 */
export type DataTransferBlocker = 'destination_not_empty' | 'unresolved_references'

/** 移行ファイル検証結果 */
export interface DataTransferValidationResponse {
  /** 現在のアカウントへ移行できる場合は true */
  importable: boolean
  /** 移行対象のプレイヤー名 */
  player_name: string
  /** 移行対象のデータ件数 */
  counts: DataTransferCountsResponse
  /** 移行を確定できない理由 */
  blockers: DataTransferBlocker[]
  /** 移行先マスターで解決できない参照 */
  unresolved_references: string[]
  /** 解決できない参照の総数 */
  unresolved_reference_count: number
}

/** ユーザーデータ移行の確定結果 */
export interface DataTransferImportResponse {
  /** 移行先で新規採番されたプレイヤーID */
  player_id: number
  /** 保存されたデータ件数 */
  counts: DataTransferCountsResponse
}

/** エクスポートAPIから受け取ったダウンロード情報 */
export interface DataTransferExportFile {
  /** 署名付き移行JSON */
  blob: Blob
  /** ダウンロード時に使用するファイル名 */
  filename: string
}

// --------------------------------

/** APIトークンの管理画面用情報 */
export interface ApiToken {
  /** APIトークンID。名称変更・削除時に使用する */
  id: number
  /** ユーザーが指定した表示名 */
  name: string
  /** 表示用のトークン先頭5文字。旧仕様からの移行データは null */
  token_prefix: string | null
  /** 最終利用日時。未使用の場合は null */
  last_used_at: string | null
  /** 発行日時 */
  created_at: string
}

/** APIトークン発行時に一度だけ返る平文トークン付きレスポンス */
export interface ApiTokenIssueResponse extends ApiToken {
  /** 発行された平文APIトークン */
  token: string
}

/** APIトークン一覧レスポンス */
export interface ApiTokenListResponse {
  /** 新しい順に並んだAPIトークン一覧 */
  tokens: ApiToken[]
}

/** APIトークン名称変更リクエスト */
export interface ApiTokenRenameRequest {
  /** 前後空白を除いて1〜50文字の新しい表示名 */
  name: string
}
