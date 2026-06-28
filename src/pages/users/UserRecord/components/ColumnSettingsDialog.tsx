import type { Component } from 'solid-js'
import ColumnSettingsDialogBase from '../../components/ColumnSettingsDialogBase.tsx'
import type { RecordColumnId } from '../types/types.ts'
import { RECORD_COLUMN_DEFINITIONS, sortVisibleColumnIdsByDefinitionOrder } from '../utils/columns.ts'

type ColumnSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleColumnIds: RecordColumnId[]
  onApply: (visibleColumnIds: RecordColumnId[]) => void
}

/**
 * 目的: 通常譜面レコードの列設定ダイアログを表示します。
 * 引数: props - 開閉状態、表示列ID、適用時のコールバック。
 * 返り値: 通常譜面用の列設定ダイアログUI。
 */
const ColumnSettingsDialog: Component<ColumnSettingsDialogProps> = (props) => {
  return (
    <ColumnSettingsDialogBase
      open={props.open}
      onOpenChange={props.onOpenChange}
      visibleColumnIds={props.visibleColumnIds}
      columnDefinitions={RECORD_COLUMN_DEFINITIONS}
      sortVisibleColumnIdsByDefinitionOrder={sortVisibleColumnIdsByDefinitionOrder}
      onApply={props.onApply}
    />
  )
}

export default ColumnSettingsDialog
