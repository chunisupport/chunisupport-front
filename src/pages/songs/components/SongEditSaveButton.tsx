import type { Component } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import { Loading } from '../../../components/Loading'
import { SONG_EDIT_COPY } from '../songEditConstants'

type Props = {
  /** 編集内容が初期値と異なるか */
  changed: boolean
  /** 保存リクエストの処理中か */
  saving: boolean
}

/**
 * 楽曲編集フォームの保存ボタンと処理中表示を描画する。
 *
 * @param props - 変更状態と保存状態。
 * @returns 変更時だけ操作できる保存ボタン。
 */
const SongEditSaveButton: Component<Props> = (props) => (
  <AppButton
    type="submit"
    variant="primary"
    disabled={!props.changed || props.saving}
    leftIcon={props.saving ? <Loading size="inline" ariaHidden /> : undefined}
  >
    {props.saving ? SONG_EDIT_COPY.savingButton : SONG_EDIT_COPY.saveButton}
  </AppButton>
)

export default SongEditSaveButton
