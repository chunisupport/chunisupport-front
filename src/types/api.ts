export interface ErrorResponse {
    error?: {
        status: number;
        code: string;
    };
}

export type ErrorCode =
    // 汎用
    | "bad_request"
    | "internal_error"
    // 認証
    | "unauthorized"
    | "invalid_credentials"
    | "invalid_token"
    | "token_expired"
    | "missing_token"
    | "invalid_session"
    // 権限
    | "forbidden"
    // ユーザー
    | "registration_failed"
    | "user_not_found"
    | "operation_failed"
    // プレイヤー
    | "player_not_found"
    // データ
    | "validation_failed"
    | "resource_not_found"
    | "conflict"
    | "api_token_not_found"
    | "payload_too_large"
    // 入力検証
    | "username_empty"
    | "username_too_short"
    | "username_too_long"
    | "username_invalid_char"
    | "password_too_short"
    | "password_too_long"
    | "invalid_password"
    // その他
    | "not_found"
    | "method_not_allowed"
    | "unsupported_media_type"
    | "too_many_requests"
    | "service_unavailable";

export const errorMessages: Record<ErrorCode, string> = {
    bad_request: "リクエスト形式が不正です",
    internal_error: "サーバーエラーが発生しました",
    unauthorized: "認証が必要です",
    invalid_credentials: "ユーザー名またはパスワードが正しくありません",
    invalid_token: "認証トークンが無効です",
    token_expired: "認証トークンの有効期限が切れています",
    missing_token: "認証トークンが必要です",
    invalid_session: "セッションが無効または期限切れです",
    forbidden: "アクセス権限がありません",
    registration_failed: "ユーザー登録に失敗しました",
    user_not_found: "ユーザーが見つかりません",
    operation_failed: "操作に失敗しました",
    player_not_found: "プレイヤーが見つかりません",
    validation_failed: "入力内容に誤りがあります",
    resource_not_found: "データが見つかりません",
    conflict: "データが競合しています",
    api_token_not_found: "APIトークンが見つかりません",
    payload_too_large: "データサイズが大きすぎます",
    username_empty: "ユーザー名が空です",
    username_too_short: "ユーザー名は5文字以上である必要があります",
    username_too_long: "ユーザー名は50文字以内である必要があります",
    username_invalid_char: "ユーザー名は小文字英数字のみ使用できます",
    password_too_short: "パスワードは8文字以上である必要があります",
    password_too_long: "パスワードは128文字以内である必要があります",
    invalid_password: "パスワードが無効です",
    not_found: "リソースが見つかりません",
    method_not_allowed: "許可されていない操作です",
    unsupported_media_type: "サポートされていないメディアタイプです",
    too_many_requests: "リクエストが多すぎます。しばらく待ってから再試行してください",
    service_unavailable: "サービスが一時的に利用できません"
};

// エラーコードからメッセージを取得するヘルパー関数
export const getErrorMessage = (code: string): string => {
    return errorMessages[code as ErrorCode] || "エラーが発生しました";
}
