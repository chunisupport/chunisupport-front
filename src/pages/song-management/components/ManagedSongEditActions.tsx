import { createSignal, Show } from 'solid-js'
import { Loading } from '../../../components'
import { AppButton } from '../../../components/common/AppButton'
import { AppConfirmDialog } from '../../../components/common/AppConfirmDialog'
import {
  formatManagedSongDeleteTargetMessage,
  SONG_MANAGEMENT_ACTION_COPY,
  SONG_MANAGEMENT_DELETE_DIALOG_COPY,
} from '../constants'

type ManagedSongEditActionsProps = {
  /** 編集内容に差分があるか */
  changed: boolean
  /** 保存中か */
  saving: boolean
  /** 選択中の楽曲が論理削除済みか */
  deleted: boolean
  /** 削除操作を許可するか */
  canDelete: boolean
  /** 削除確認ダイアログの見出し */
  deleteDialogTitle: string
  /** 削除確認ダイアログに表示する対象の楽曲名 */
  deleteTargetTitle: string
  /** 更新ボタン押下時の処理 */
  onSave: () => void
  /** 削除確認ダイアログで確定したときの処理。完了するまでダイアログを処理中にする */
  onDelete: () => Promise<void>
  /** 復活ボタン押下時の処理 */
  onRestore: () => void
}

/**
 * 楽曲編集フォームの更新・削除・復活ボタンと、削除前の確認ダイアログを描画する。
 * 削除済みなら復活ボタン、未削除なら権限に応じて削除ボタンを表示する。
 *
 * @param props 操作可否と各ボタンの処理
 * @returns 操作ボタン群と削除確認ダイアログ
 */
const ManagedSongEditActions = (props: ManagedSongEditActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false)
  const [deleting, setDeleting] = createSignal(false)

  /**
   * 確認ダイアログで確定された削除を実行し、完了後にダイアログを閉じる。
   *
   * @returns 削除処理完了後に解決されるPromise。
   */
  const handleConfirmDelete = async (): Promise<void> => {
    setDeleting(true)
    try {
      await props.onDelete()
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

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
          <AppButton variant="danger" onClick={() => setDeleteDialogOpen(true)}>
            {SONG_MANAGEMENT_ACTION_COPY.delete}
          </AppButton>
        </Show>
      </Show>

      <AppConfirmDialog
        open={deleteDialogOpen()}
        onOpenChange={setDeleteDialogOpen}
        title={props.deleteDialogTitle}
        description={formatManagedSongDeleteTargetMessage(props.deleteTargetTitle)}
        cancelLabel={SONG_MANAGEMENT_DELETE_DIALOG_COPY.cancel}
        confirmLabel={
          deleting()
            ? SONG_MANAGEMENT_DELETE_DIALOG_COPY.deleting
            : SONG_MANAGEMENT_DELETE_DIALOG_COPY.submit
        }
        confirmVariant="danger"
        pending={deleting()}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}

export default ManagedSongEditActions
