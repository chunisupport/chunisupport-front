/**
 * パスの大文字小文字と空セグメントを正規化し、ルーターと同じ画面として比較できる形へ揃える。
 *
 * @param pathname - ブラウザーの現在パス。
 * @returns 小文字化し、重複・末尾スラッシュを除去した絶対パス。
 */
export const normalizeRoutePathname = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean)
  return segments.length === 0 ? '/' : `/${segments.join('/').toLowerCase()}`
}
