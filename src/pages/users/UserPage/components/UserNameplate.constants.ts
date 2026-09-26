import { localizedCopy } from '../../../../i18n'

/** プロフィールカードの表示文言 */
export const USER_NAMEPLATE_TEXT = localizedCopy('users.nameplate')
/** プロフィールカードと、その下に置く独立した操作ボタンの幅 */
export const USER_NAMEPLATE_WIDTH_CLASS = 'mx-auto w-[min(380px,calc(100%-2rem))]'

/** プロフィールカードの指標表示で使用するラベル */
export const USER_NAMEPLATE_METRIC_LABELS = {
  rating: 'RATING',
  best: 'BEST',
  new: 'NEW',
  overPower: 'OVER POWER',
} as const

/** プロフィールカードの履歴導線で使用する文言 */
export const USER_NAMEPLATE_HISTORY_LINK_LABEL = USER_NAMEPLATE_TEXT.historyLink
/** プロフィールカードの履歴導線を説明するアクセシブル名 */
export const USER_NAMEPLATE_HISTORY_LINK_ARIA_LABEL = USER_NAMEPLATE_TEXT.historyLinkAriaLabel

/** 定数未判明の譜面がレーティングまたはOVER POWERの計算に含まれることを示すマーカー */
export const USER_NAMEPLATE_UNKNOWN_CONST_MARKER = '?'
/** 定数未判明の譜面がレーティングまたはOVER POWERの計算に含まれることを説明する文言 */
export const USER_NAMEPLATE_UNKNOWN_CONST_HINT = USER_NAMEPLATE_TEXT.unknownConstHint
