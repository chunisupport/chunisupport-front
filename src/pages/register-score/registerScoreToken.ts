const UPLOAD_TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Solid Router のクエリ値から単一のアップロードトークンを取り出す。
 *
 * @param token - token クエリ値。
 * @returns 利用可能な先頭トークン。未指定時は null。
 */
export const normalizeUploadTokenParam = (token: string | string[] | undefined): string | null => {
  if (Array.isArray(token)) {
    return token[0] ?? null
  }
  return token ?? null
}

/**
 * アップロードトークンが UUID v4 形式か判定する。
 *
 * @param token - 判定するアップロードトークン。
 * @returns UUID v4 形式なら true。
 */
export const isValidUploadToken = (token: string): boolean => UPLOAD_TOKEN_PATTERN.test(token)
