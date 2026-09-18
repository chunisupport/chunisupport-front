import type { Component, JSX } from 'solid-js'
import { SITE_NAME } from '../../../../constants/site'
import { RATING_IMAGE_COPY } from '../UserProfileView.constants'

type RatingImageFooterProps = {
  /** footer要素へ付与するクラス */
  class?: string
  /** footer要素へ付与するインラインスタイル */
  style?: JSX.CSSProperties
}

/**
 * レーティング枠画像下部の生成元表記と免責文を表示する。
 *
 * @param props - footerの見た目をシート側で調整するクラスとスタイル。
 * @returns 生成元と著作権・非公式免責のフッター。
 */
export const RatingImageFooter: Component<RatingImageFooterProps> = (props) => (
  <footer class={props.class} style={props.style}>
    <p class="font-sans text-[16px] text-text-muted">
      {RATING_IMAGE_COPY.generatedByPrefix}
      <span class="font-bold">{SITE_NAME}</span>
      {` (${RATING_IMAGE_COPY.generatedByUrl})`}
    </p>
    <p class="font-sans text-[12px] text-text-muted">{RATING_IMAGE_COPY.jacketCopyright}</p>
    <p class="font-sans text-[12px] text-text-muted">{RATING_IMAGE_COPY.unofficialDisclaimer}</p>
  </footer>
)
