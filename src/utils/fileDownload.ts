/** ダウンロード開始後にObject URLを解放するまでの待機時間 */
const OBJECT_URL_REVOKE_DELAY_MS = 1_000

/**
 * Blobを指定ファイル名でダウンロードする。
 *
 * @param blob - ダウンロードするファイル内容。
 * @param filename - ダウンロード時に使用する拡張子付きファイル名。
 * @returns なし。
 */
export const downloadBlobFile = (blob: Blob, filename: string): void => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = objectUrl
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), OBJECT_URL_REVOKE_DELAY_MS)
}
