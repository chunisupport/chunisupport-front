import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import type { GoalCreateRequest, GoalDTO, GoalUpdateRequest } from '../../../../types/api'
import type { GoalProgressResult } from '../../utils/goalProgress'
import type { GoalsListData } from '../goalsListResource'
import GoalDeleteDialog from './GoalDeleteDialog'
import GoalFormDialog from './GoalFormDialog'

interface GoalsListDialogsProps {
  data?: GoalsListData
  formOpen: boolean
  deleteOpen: boolean
  editingGoal?: GoalDTO
  deletingGoal?: GoalDTO
  isSaving: boolean
  isDeleting: boolean
  formError: string
  onFormOpenChange: (open: boolean) => void
  onDeleteOpenChange: (open: boolean) => void
  onSave: (payload: GoalCreateRequest | GoalUpdateRequest) => Promise<void>
  onDeleteConfirm: () => void
  resolveAllCount: (attributes: GoalCreateRequest['attributes']) => number
  resolveOverPowerChartMax: (attributes: GoalCreateRequest['attributes']) => number
  resolveDraftGoalProgress: (goal: GoalCreateRequest) => GoalProgressResult
}

/**
 * 目標一覧画面で利用する作成/編集フォームと削除確認ダイアログを描画する。
 *
 * @param props - ダイアログ状態、対象目標、保存/削除ハンドラ、フォーム用解決関数。
 * @returns 目標一覧画面のダイアログ群。
 */
export const GoalsListDialogs: Component<GoalsListDialogsProps> = (props) => (
  <>
    <Show when={props.data}>
      {(data) => (
        <GoalFormDialog
          open={props.formOpen}
          mode={props.editingGoal ? 'edit' : 'create'}
          initialGoal={props.editingGoal}
          masterData={data().masterData}
          versions={data().versions}
          isSaving={props.isSaving}
          apiErrorMessage={props.formError}
          onOpenChange={props.onFormOpenChange}
          onSave={props.onSave}
          resolveAllCount={props.resolveAllCount}
          resolveOverPowerChartMax={props.resolveOverPowerChartMax}
          resolveDraftGoalProgress={props.resolveDraftGoalProgress}
        />
      )}
    </Show>

    <GoalDeleteDialog
      open={props.deleteOpen}
      goal={props.deletingGoal}
      isDeleting={props.isDeleting}
      onOpenChange={props.onDeleteOpenChange}
      onConfirm={props.onDeleteConfirm}
    />
  </>
)
