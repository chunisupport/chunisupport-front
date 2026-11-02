import type { OverPowerAggregationTarget } from '../../../../usecases/overpower/types'
import { formatFileTimestamp } from '../../../../utils/localDateTime'
import type { OverPowerSubPage } from '../../../../utils/userProfileRoute'

/** OVER POWER画像のファイル名の接頭辞 */
const OVER_POWER_IMAGE_FILENAME_PREFIX = 'chunisupport-overpower'

/**
 * OVER POWER画像のダウンロードファイル名を生成する。
 *
 * @param condition - ユーザー名、表示軸のサブページ、集計対象。
 * @param date - ファイル名へ付与する日時。省略時は現在時刻。
 * @returns `chunisupport-overpower-{username}-{表示軸}-{集計対象}-{YYYYMMDDhhmmss}.png` 形式の小文字のファイル名。
 */
export const formatOverPowerImageFilename = (
  condition: {
    username: string
    subPage: OverPowerSubPage
    aggregationTarget: OverPowerAggregationTarget
  },
  date: Date = new Date()
): string =>
  [
    OVER_POWER_IMAGE_FILENAME_PREFIX,
    condition.username,
    condition.subPage,
    condition.aggregationTarget.replaceAll('_', '-'),
    formatFileTimestamp(date),
  ]
    .join('-')
    .toLowerCase()
    .concat('.png')
