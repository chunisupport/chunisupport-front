/**
 * WORLD'S END楽曲詳細の表示IDルートパラメータをデコードする。
 *
 * `@solidjs/router` の `useParams` はパスを `URL.pathname` のセグメントとして渡すだけで、
 * `decodeURIComponent` は呼ばない。画面遷移は `encodeURIComponent` したパスを使うため、
 * ここで1回だけデコードする。不正なパーセントエンコードは例外にせず null を返す。
 *
 * @param displayIdParam - ルートから受け取った表示ID。
 * @returns デコードした表示ID。不正なエンコードの場合は null。
 */
export const decodeWorldsendDisplayIdParam = (displayIdParam: string): string | null => {
  try {
    return decodeURIComponent(displayIdParam)
  } catch (error) {
    if (error instanceof URIError) return null
    throw error
  }
}

/**
 * WORLD'S END楽曲詳細の取得に使う表示IDを決める。
 *
 * @param displayIdParam - ルートから受け取った表示ID。
 * @returns APIに渡す表示ID。空文字または不正なエンコードの場合は false。
 */
export const getWorldsendDisplayIdSource = (displayIdParam: string): string | false => {
  const decodedDisplayId = decodeWorldsendDisplayIdParam(displayIdParam)
  return decodedDisplayId ? decodedDisplayId : false
}

/**
 * WORLD'S END楽曲詳細を Not Found として表示するか判定する。
 * 不正な表示IDはAPIを呼ばず、取得結果の404と同じ画面へ収束させる。
 *
 * @param displayIdSource - デコード済みの表示ID。無効な場合は false。
 * @param loadType - 楽曲取得状態の種別。未取得の場合は undefined。
 * @returns Not Found を表示する場合は true。
 */
export const isWorldsendSongDetailNotFound = (
  displayIdSource: string | false,
  loadType: string | undefined
): boolean => displayIdSource === false || loadType === 'notFound'
