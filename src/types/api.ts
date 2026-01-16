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
    registration_failed: "このユーザー名は使用できません",
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
export const getErrorMessage = (error: ErrorResponse): string => {
    const code = error.error?.code;
    if (code && code in errorMessages) {
        return errorMessages[code as ErrorCode];
    }
    return "エラーが発生しました";
}

// --------------------------------

export interface UserDTO {
    username: string;
    player: PlayerDTO | null;
    account_type?: "PLAYER" | "EDITOR" | "ADMIN";
}

export interface AdminUserListResponse {
    username: string;
    player_name: string;
    rating: number | null;
    overpower_value: number | null;
    is_private: boolean;
    is_deleted: boolean;
}

export interface UserProfileWithRecordsDTO {
    username: string;
    player: PlayerDTO;
    records: UserRecordResponseDTO;
    updated_at: string;
}

export interface PlayerDTO {
    name: string;
    level: number;
    rating: number;
    class_emblem_id: number | null;
    class_emblem_base_id: number | null;
    last_played_at: string | null;
    overpower_value: number | null;
    overpower_percent: number | null;
    team_name: string | null;
    team_color: string | null;
    honors: HonorDTO[];
    created_at: string;
    updated_at: string;
}

export interface HonorDTO {
    slot: 1 | 2 | 3;
    name: string;
    type_name:
        "normal"
        | "copper"
        | "silver"
        | "gold"
        | "platina"
        | "rainbow"
        | "staff"
        | "ongeki"
        | "maimai"
        | "sp"
        | "phoenix_g"
        | "phoenix_p"
        | "phoenix_r"
        | "expert"
        | "master"
        | "ultima";
    image_url: string | null;
}

export interface UserRecordResponseDTO {
    updated_at: string;
    best: PlayerRecordDTO[];
    best_candidate: PlayerRecordDTO[];
    new: PlayerRecordDTO[];
    new_candidate: PlayerRecordDTO[];
    all: PlayerRecordDTO[];
    worldsend?: WorldsendRecordDTO[];
}

export interface PlayerRecordDTO {
    updated_at: string;
    difficulty: "BASIC" | "ADVANCED" | "EXPERT" | "MASTER" | "ULTIMA";
    id: string;
    title: string;
    artist: string;
    const: number;
    is_const_unknown: boolean;
    score: number;
    rating: number;
    overpower: number;
    img: string;
    clear_lamp: "FAILED" | "CLEAR" | "HARD" | "BRAVE" | "ABSOLUTE" | "CATASTROPHY";
    combo_lamp: "FULL COMBO" | "ALL JUSTICE" | null;
    full_chain: "FULL CHAIN GOLD" | "FULL CHAIN PLATINUM" | null;
    slot: string | null;
}

export interface WorldsendRecordDTO {
    updated_at: string;
    id: string;
    title: string;
    artist: string;
    we_star: number | null;         // WORLD'S END 星の数（1～5）
    we_kanji: string | null;        // WORLD'S END カテゴリ漢字
    notes: number | null;
    score: number;
    img: string;
    clear_lamp: "FAILED" | "CLEAR" | "HARD" | "BRAVE" | "ABSOLUTE" | "CATASTROPHY";
    combo_lamp: "FULL COMBO" | "ALL JUSTICE" | null;
    full_chain: "FULL CHAIN GOLD" | "FULL CHAIN PLATINUM" | null;
}
