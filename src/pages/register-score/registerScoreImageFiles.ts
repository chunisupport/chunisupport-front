/**
 * ページ順のJPEGを共有・保存用の連番ファイルへ変換する。
 *
 * @param blobs - ページ順に並ぶJPEG画像。
 * @param filename - 拡張子付きの元ファイル名。
 * @returns 単一画像では元の名前、複数画像では連番を付けたファイル。
 */
export const createRegisterScoreImageFiles = (blobs: readonly Blob[], filename: string): File[] =>
  blobs.map(
    (blob, index) =>
      new File(
        [blob],
        blobs.length === 1 ? filename : filename.replace(/\.jpg$/i, `-${index + 1}.jpg`),
        { type: 'image/jpeg' }
      )
  )
