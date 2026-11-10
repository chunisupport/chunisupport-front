import { Pencil } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { AppIconButton } from '../../../components/common/AppButton'
import { authSession } from '../../../stores/authSession'
import { canEditSongMaster } from '../../../utils/songEditorRole'

type Props = {
  /** ボタンのアクセシブル名 */
  ariaLabel: string
  /** 編集ダイアログを開く処理 */
  onClick: () => void
}

/**
 * EDITOR / ADMIN にだけ表示する、カード右上固定のマスタ編集ボタン。
 *
 * @param props - アクセシブル名とクリックハンドラ。
 * @returns 権限がある場合のみ表示するアイコンボタン。
 */
const SongMasterEditButton: Component<Props> = (props) => (
  <Show
    when={
      authSession.status === 'authenticated' && canEditSongMaster(authSession.user?.account_type)
    }
  >
    <AppIconButton
      class="absolute top-2 right-2 z-10"
      aria-label={props.ariaLabel}
      title={props.ariaLabel}
      onClick={props.onClick}
    >
      <Pencil class="h-4 w-4" aria-hidden="true" />
    </AppIconButton>
  </Show>
)

export default SongMasterEditButton
