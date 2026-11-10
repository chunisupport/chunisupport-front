import { formatFileTimestamp } from '../../utils/localDateTime'
import { REGISTER_SCORE_IMAGE_FILENAME_PREFIX } from './constants'

/**
 * 更新日時から更新差分JPEG画像のファイル名を生成する。
 *
 * @param isoDateTime - APIから返却されたISO形式の更新日時。
 * @returns `chunisupport-score-update-YYYYMMDD-HHmmss.jpg` 形式のファイル名。
 */
export const formatRegisterScoreImageFilename = (isoDateTime: string): string =>
  `${REGISTER_SCORE_IMAGE_FILENAME_PREFIX}-${formatFileTimestamp(new Date(isoDateTime), '-')}.jpg`

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
