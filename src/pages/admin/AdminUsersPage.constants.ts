/** ユーザー管理画面の集計表示に使用する文言 */
export const ADMIN_USER_STATISTICS_COPY = {
  heading: 'ユーザー集計',
  totalUsers: '全ユーザー',
  usersWithPlayerData: 'プレイヤーデータ連携済み',
  activePlayerDataLast30Days: '直近30日更新のプレイヤーデータ',
  loadingLabel: 'ユーザー集計を読み込み中',
  loadError: 'ユーザー集計を取得できませんでした。',
} as const

/** ユーザー管理画面の一覧・検索に使用する文言 */
export const ADMIN_USER_LIST_COPY = {
  pageTitle: 'ユーザー管理',
  pageDescription: 'ユーザー権限と不審アカウントフラグの変更、一覧、検索、物理削除を管理できます。',
  searchLabel: 'ユーザー/プレイヤー名（前方一致）',
  searchPlaceholder: '例: user',
  searchButton: '検索',
  empty: '一致するユーザーが見つかりません。',
  loadingLabel: 'ユーザー一覧を読み込み中',
  permissionLabel: '権限',
  permissionLoadingLabel: '権限候補を読み込み中',
  permissionLoadError: '権限候補を取得できませんでした。',
  permissionUpdateError: '権限の変更に失敗しました。',
  permissionUpdateSuccess: 'ユーザーの権限を変更しました。',
  suspiciousLabel: '不審アカウントフラグ',
  suspiciousUpdateError: '不審アカウントフラグの変更に失敗しました。',
  suspiciousUpdateSuccess: '不審アカウントフラグを変更しました。',
  privateLabel: '非公開フラグ',
  deleteButton: '削除',
  deleteError: '削除に失敗しました。',
  deleteSuccess: 'ユーザーを削除しました。',
  tableHeaders: {
    username: 'username',
    accountType: 'account_type',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    playerName: 'player_name',
    rating: 'rating',
    overpowerValue: 'overpower_value',
    suspicious: 'is_suspicious',
    private: 'is_private',
    actions: '操作',
  },
} as const

/**
 * ユーザー物理削除の確認文言を作成する。
 *
 * @param username - 削除対象のユーザー名。
 * @returns 確認ダイアログに表示する文言。
 */
export const formatAdminUserDeleteConfirmation = (username: string): string =>
  `ユーザー ${username} を物理削除しますか？この操作は取り消せません。`

/**
 * ユーザーごとのフラグ切り替えに使うアクセシブルなラベルを作成する。
 *
 * @param username - 対象ユーザー名。
 * @param flagLabel - 対象フラグの表示名。
 * @returns ユーザー名とフラグ名を組み合わせたラベル。
 */
export const formatAdminUserFlagLabel = (username: string, flagLabel: string): string =>
  `${username}の${flagLabel}`
