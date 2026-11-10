import type { JSX } from 'solid-js'
import type { DecimalDisplayParts } from '../../utils/numberFormat'

/** 小数部を整数部より一回り小さく表示する文字サイズクラス。 */
const FRACTION_CLASS = 'text-[0.8em]'

/**
 * 整数部と小数部に分けた数値を、小数部だけ一回り小さく表示する。
 *
 * @param props.parts - 表示する整数部と小数部。
 * @returns 小数部を縮小表示した数値。
 */
export const SplitDecimal = (props: { parts: DecimalDisplayParts }): JSX.Element => (
  <>
    {props.parts.integerPart}
    <span class={FRACTION_CLASS}>{props.parts.fractionPart}</span>
  </>
)
