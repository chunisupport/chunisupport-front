import type { HonorDTO, PlayerRecordDTO } from '../../../../types/api'
import { formatOverPowerPercent, formatOverPowerValue } from '../../../../utils/overPowerFormat'

/** OVER POWERの1行表記で使うラベル */
const OVER_POWER_LINE_LABEL = 'OP'

/**
 * プロフィール画像へ表示する代表称号を取得する。
 *
 * @param honors - APIから取得した称号一覧。
 * @returns 1枠目を優先した代表称号。称号がない場合はundefined。
 */
export const getPrimaryHonor = (honors: HonorDTO[]): HonorDTO | undefined =>
  honors.find((honor) => honor.slot === 1) ?? honors[0]

/** 称号スロットの枠番号 */
export const HONOR_SLOT_NUMBERS = [1, 2, 3] as const

/**
 * 称号を1〜3枠のスロット配列へ揃える。
 *
 * @param honors - APIから取得した称号一覧。
 * @returns 各枠の称号。未設定枠はnull。
 */
export const buildHonorSlots = (honors: HonorDTO[]): Array<HonorDTO | null> =>
  HONOR_SLOT_NUMBERS.map((slot) => honors.find((honor) => honor.slot === slot) ?? null)

/**
 * OVER POWER値を画像用の表示文字列へ整形する。
 *
 * @param value - プレイヤーのOVER POWER値。
 * @returns 整形済み文字列。未設定の場合はハイフン。
 */
export const formatRatingImageOverPowerValue = (value: number | null): string =>
  value === null ? '-' : formatOverPowerValue(value)

/**
 * OVER POWER達成率を画像用の表示文字列へ整形する。
 *
 * @param value - プレイヤーのOVER POWER達成率。
 * @returns 整形済み文字列。未設定の場合はハイフン。
 */
export const formatRatingImageOverPowerPercent = (value: number | null): string =>
  value === null ? '-' : formatOverPowerPercent(value)

/**
 * OVER POWER値と達成率を1行の画像用表記へ整形する。
 *
 * @param value - プレイヤーのOVER POWER値。
 * @param percent - プレイヤーのOVER POWER達成率。
 * @returns `OP 123.456 (12.34567%)` 形式の文字列。
 */
export const formatRatingImageOverPowerLine = (
  value: number | null,
  percent: number | null
): string =>
  `${OVER_POWER_LINE_LABEL} ${formatRatingImageOverPowerValue(value)} (${formatRatingImageOverPowerPercent(percent)}%)`

/**
 * レーティング枠画像 Ver. 2 のコンボランプバッジ文言を返す。
 * AJCも ALL JUSTICE と表示し、虹色はバッジの色クラス側で付ける。
 *
 * @param lamp - APIのコンボランプ値。
 * @returns FULL COMBO または ALL JUSTICE。表示対象外は空文字。
 */
export const getRatingImageV2ComboLampLabel = (lamp: PlayerRecordDTO['combo_lamp']): string => {
  if (lamp === 'FULL COMBO' || lamp === 'ALL JUSTICE') return lamp
  return ''
}
