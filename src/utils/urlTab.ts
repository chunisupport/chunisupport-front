/**
 * タブに対応するURLパスを生成する。セグメントが空文字のタブは基準パスそのものになる。
 *
 * @param basePath - タブを持つ画面の基準パス。
 * @param segments - タブごとのURLパスセグメント。
 * @param tab - URLへ反映するタブ。
 * @returns タブを表示するURLパス。
 */
export const buildUrlTabPath = <TTab extends string>(
  basePath: string,
  segments: Readonly<Record<TTab, string>>,
  tab: TTab
): string => {
  const segment = segments[tab]
  return segment ? `${basePath}/${segment}` : basePath
}

/**
 * URLパスセグメントからタブを復元する。セグメントがない場合は既定タブとして扱う。
 *
 * @param segments - タブごとのURLパスセグメント。
 * @param segment - URLパスのタブ部分。
 * @param defaultTab - セグメントがない場合のタブ。
 * @returns 対応するタブ。未対応のセグメントの場合は null。
 */
export const resolveUrlTab = <TTab extends string>(
  segments: Readonly<Record<TTab, string>>,
  segment: string | undefined,
  defaultTab: TTab
): TTab | null => {
  if (segment === undefined) return defaultTab
  return (Object.keys(segments) as TTab[]).find((tab) => segments[tab] === segment) ?? null
}
