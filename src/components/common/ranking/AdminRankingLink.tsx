import { A } from '@solidjs/router'
import Trophy from 'lucide-solid/icons/trophy'
import { Show } from 'solid-js'
import { authSession } from '../../../stores/authSession'
import { getAppButtonClass } from '../AppButton'
import { ADMIN_RANKING_LINK_LABEL } from './constants'

/**
 * 管理者に全体ランキングへのリンクを表示する。
 *
 * @param props - 全体ランキングのパス。
 * @returns ADMIN用のナビゲーションリンク。
 */
const AdminRankingLink = (props: { href: string }) => (
  <Show when={authSession.status === 'authenticated' && authSession.user?.account_type === 'ADMIN'}>
    <div class="flex justify-end">
      <A href={props.href} class={getAppButtonClass({ variant: 'surface', size: 'sm' })}>
        <Trophy class="h-4 w-4" aria-hidden="true" />
        {ADMIN_RANKING_LINK_LABEL}
      </A>
    </div>
  </Show>
)

export default AdminRankingLink
