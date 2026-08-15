/**
 * フレンド申請の username 入力を許可文字のみへ正規化する。
 *
 * 大文字は小文字へ変換し、`0-9` と `a-z` 以外の文字は取り除く。
 * 直接入力に加え、コピー＆ペーストされた文字列にも対応する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @returns 小文字英数字（`0-9a-z`）だけを含む文字列。
 */
export const sanitizeFriendUsernameInput = (value: string): string =>
  value.toLowerCase().replace(/[^0-9a-z]/g, '')
