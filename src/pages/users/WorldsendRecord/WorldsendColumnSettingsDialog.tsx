import type { Component } from 'solid-js'
import ColumnSettingsDialogBase from '../components/ColumnSettingsDialogBase'
import {
  sortVisibleWorldsendColumnIdsByDefinitionOrder,
  WORLDSEND_RECORD_COLUMN_DEFINITIONS,
  type WorldsendRecordColumnId,
} from './utils/columns'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleColumnIds: WorldsendRecordColumnId[]
  onApply: (visibleColumnIds: WorldsendRecordColumnId[]) => void
}

/**
 * 目的: WORLD'S ENDレコードの列設定ダイアログを表示します。
 * 引数: props - 開閉状態、表示列ID、適用時のコールバック。
 * 返り値: WORLD'S END用の列設定ダイアログUI。
 */
const WorldsendColumnSettingsDialog: Component<Props> = (props) => {
  return (
    <ColumnSettingsDialogBase
      open={props.open}
      onOpenChange={props.onOpenChange}
      visibleColumnIds={props.visibleColumnIds}
      columnDefinitions={WORLDSEND_RECORD_COLUMN_DEFINITIONS}
      sortVisibleColumnIdsByDefinitionOrder={sortVisibleWorldsendColumnIdsByDefinitionOrder}
      onApply={props.onApply}
    />
  )
}

export default WorldsendColumnSettingsDialog
