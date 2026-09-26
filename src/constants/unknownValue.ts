import { t } from '../i18n'

/**
 * バージョン・ジャンル・属性などが判別できない場合に表示し、集計キーとしても使う文言。
 * 表示言語の切り替えは再読み込みで反映されるため、読み込み時の表示言語で固定する。
 */
export const UNKNOWN_VALUE_LABEL = t('common.unknown')
