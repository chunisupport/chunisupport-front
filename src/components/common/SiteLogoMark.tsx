import type { Component } from 'solid-js'
import logoSingle from '../../assets/logo_single.svg'

type Props = {
  /** 大きさと色（`bg-*`）を指定するクラス */
  class: string
}

/**
 * 単色のChuniSupportロゴを、背景色をマスクで切り抜いて表示する。
 *
 * 色は背景色で指定するため、テーマに合わせた文字色トークンなどをそのまま使える。
 *
 * @param props - 大きさと色のクラス。
 * @returns 装飾用のロゴ要素。
 */
export const SiteLogoMark: Component<Props> = (props) => (
  <span
    aria-hidden="true"
    class={`shrink-0 ${props.class}`}
    style={{
      'mask-image': `url(${logoSingle})`,
      'mask-position': 'center',
      'mask-repeat': 'no-repeat',
      'mask-size': 'contain',
    }}
  />
)
