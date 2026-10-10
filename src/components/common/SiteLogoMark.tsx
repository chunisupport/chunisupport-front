import type { Component, JSX } from 'solid-js'
import logoSingle from '../../assets/logo_single.svg'

type Props = {
  /** 大きさと色（`bg-*`）を指定するクラス */
  class: string
  /** 色をクラスで表せない場合に追加するスタイル */
  style?: JSX.CSSProperties
}

/**
 * 単色のChuniSupportロゴを、背景色をマスクで切り抜いて表示する。
 *
 * 色は背景色で指定するため、テーマに合わせた文字色トークンなどをそのまま使える。
 *
 * @param props - 大きさと色のクラス、追加スタイル。
 * @returns 装飾用のロゴ要素。
 */
export const SiteLogoMark: Component<Props> = (props) => (
  <span
    aria-hidden="true"
    class={`shrink-0 ${props.class}`}
    style={{
      ...props.style,
      'mask-image': `url(${logoSingle})`,
      'mask-position': 'center',
      'mask-repeat': 'no-repeat',
      'mask-size': 'contain',
    }}
  />
)
