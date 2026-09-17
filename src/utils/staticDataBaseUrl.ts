/**
 * フロントエンドURLから同一環境の静的データ配信元を生成する。
 *
 * @param frontendBaseUrl - 環境ごとのフロントエンドURL。
 * @param configuredBaseUrl - 環境変数で明示された静的データ配信元。
 * @returns 明示された配信元、またはホスト名へstatic.を付けた配信元。
 */
export const resolveStaticDataBaseUrl = (
  frontendBaseUrl: string,
  configuredBaseUrl?: string
): string => {
  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, '')

  const url = new URL(frontendBaseUrl)
  url.hostname = `static.${url.hostname}`
  url.pathname = ''
  url.search = ''
  url.hash = ''
  return url.toString().replace(/\/$/, '')
}
