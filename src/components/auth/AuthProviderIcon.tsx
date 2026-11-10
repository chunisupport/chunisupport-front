import { Match, Switch } from 'solid-js'

import googleGLogo from '../../assets/brands/google-g-logo.png'
import type { AuthProviderKind } from '../../constants/authProviders'

/** 認証プロバイダのロゴ表示に使う指定 */
export type AuthProviderIconProps = {
  /** 表示する認証プロバイダの種類 */
  kind: AuthProviderKind
  /** 配置用に追加する Tailwind クラス（`shrink-0` など）。ロゴの大きさはブランドガイドに合わせて固定する。 */
  class?: string
}

/**
 * 認証プロバイダのロゴを表示する。
 * Lucide にはサービスのロゴがないため、各サービスが配布する公式ロゴを加工せずに使う。
 * ロゴは20pxで固定し、プロバイダ間で並びがそろうよう同じ大きさの丸い枠の中央に置く。
 * 入手元と利用ルールは docs/authentication.md の「ロゴ」を参照。
 *
 * @param props - 表示する認証プロバイダとクラス。
 * @returns 装飾用のロゴ要素。
 */
export const AuthProviderIcon = (props: AuthProviderIconProps) => (
  <span
    aria-hidden="true"
    class={`inline-flex h-7 w-7 items-center justify-center rounded-full ${props.class ?? ''}`}
    classList={{ 'bg-brand-google-logo-bg': props.kind === 'google' }}
  >
    <Switch>
      <Match when={props.kind === 'google'}>
        {/* Google の G は白い背景の上に置く規定のため、どのテーマでも白丸に載せる。 */}
        <img src={googleGLogo} alt="" draggable={false} class="h-5 w-5 object-contain" />
      </Match>
      <Match when={props.kind === 'x'}>
        {/* パスは X 公式の logo.svg と同一。色はブランドガイドの黒・白をテーマで切り替える。 */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 1227"
          class="h-5 w-5 text-brand-x-logo"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z"
          />
        </svg>
      </Match>
    </Switch>
  </span>
)
