import { formatFileTimestamp } from '../../../../utils/fileTimestamp'
import type { RatingImageVersion } from '../UserProfileView.constants'

const RATING_IMAGE_FILENAME_PREFIX = 'chunisupport-best-new'

/**
 * ベスト枠・新曲枠画像のダウンロードファイル名を生成する。
 *
 * @param username - プロフィールURLに使用するユーザー名。
 * @param date - ファイル名へ付与する日時。省略時は現在時刻。
 * @param version - 画像のデザインバージョン。Ver. 1は接尾辞なし。
 * @returns `chunisupport-best-new[-v2]-{username}-{YYYYMMDDhhmmss}.jpg` 形式のファイル名。
 */
export const formatRatingImageFilename = (
  username: string,
  date: Date = new Date(),
  version: RatingImageVersion = 'v1'
): string => {
  const versionSegment = version === 'v1' ? '' : `-${version}`

  return `${RATING_IMAGE_FILENAME_PREFIX}${versionSegment}-${username}-${formatFileTimestamp(date)}.jpg`
}
