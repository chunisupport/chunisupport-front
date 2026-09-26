import { Show } from 'solid-js'
import { Loading } from '../../../components'
import { AppButton } from '../../../components/common/AppButton'
import { SONG_MANAGEMENT_ACTION_COPY } from '../constants'

type ManagedSongEditActionsProps = {
  /** 編集内容に差分があるか */
  changed: boolean
  /** 保存中か */
  saving: boolean
  /** 選択中の楽曲が論理削除済みか */
  deleted: boolean
  /** 削除操作を許可するか */
  canDelete: boolean
  /** 更新ボタン押下時の処理 */
  onSave: () => void
  /** 削除ボタン押下時の処理 */
  onDelete: () => void
  /** 復活ボタン押下時の処理 */
  onRestore: () => void
}

/**
 * 楽曲編集フォームの更新・削除・復活ボタンを描画する。
 * 削除済みなら復活ボタン、未削除なら権限に応じて削除ボタンを表示する。
 *
 * @param props 操作可否と各ボタンの処理
 * @returns 操作ボタン群
 */
const ManagedSongEditActions = (props: ManagedSongEditActionsProps) => {
  return (
    <div class="flex flex-wrap gap-2">
      <AppButton
        variant="primary"
        onClick={props.onSave}
        disabled={!props.changed || props.saving}
        leftIcon={props.saving ? <Loading size="inline" ariaHidden /> : undefined}
      >
        {SONG_MANAGEMENT_ACTION_COPY.update}
      </AppButton>
      <Show
        when={!props.deleted}
        fallback={
          <AppButton variant="success" onClick={props.onRestore}>
            {SONG_MANAGEMENT_ACTION_COPY.restore}
          </AppButton>
        }
      >
        <Show when={props.canDelete}>
          <AppButton variant="danger" onClick={props.onDelete}>
            {SONG_MANAGEMENT_ACTION_COPY.delete}
          </AppButton>
        </Show>
      </Show>
    </div>
  )
}

export default ManagedSongEditActions
