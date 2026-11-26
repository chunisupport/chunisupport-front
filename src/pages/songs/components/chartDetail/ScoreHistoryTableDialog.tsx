import { Dialog } from '@kobalte/core/dialog'
import List from 'lucide-solid/icons/list'
import { createSignal, type JSX } from 'solid-js'
import { getAppButtonClass } from '../../../../components/common/AppButton'
import { AppDialog } from '../../../../components/common/AppDialog'
import {
  SCORE_HISTORY_CLOSE_LABEL,
  SCORE_HISTORY_SECTION_LABEL,
  SCORE_HISTORY_TABLE_TOGGLE_LABEL,
} from './constants'

/**
 * 楽曲・コースの履歴一覧を、見出し横のボタンから開くダイアログで表示する。
 *
 * @param props - ダイアログに表示する履歴表と操作欄。
 * @returns 履歴一覧ボタンとダイアログ。
 */
const ScoreHistoryTableDialog = (props: { children: JSX.Element }) => {
  const [open, setOpen] = createSignal(false)

  return (
    <AppDialog
      open={open()}
      onOpenChange={setOpen}
      placement="sheet"
      size="2xl"
      height="max80"
      title={SCORE_HISTORY_SECTION_LABEL}
      closeLabel={SCORE_HISTORY_CLOSE_LABEL}
      scroll="grow"
      bodyClass="mt-4"
      trigger={
        <Dialog.Trigger
          as="button"
          type="button"
          class={getAppButtonClass({ size: 'sm', class: 'gap-1.5' })}
        >
          <List class="h-4 w-4" aria-hidden="true" />
          {SCORE_HISTORY_TABLE_TOGGLE_LABEL}
        </Dialog.Trigger>
      }
    >
      {props.children}
    </AppDialog>
  )
}

export default ScoreHistoryTableDialog
