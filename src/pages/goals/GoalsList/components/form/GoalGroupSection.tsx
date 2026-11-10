import type { Component } from 'solid-js'
import { createMemo } from 'solid-js'
import { FormSelect } from '../../../../../components/common/AppSelect'
import type { GoalGroupDTO } from '../../../../../types/api'
import { GOAL_GROUP_COPY } from '../../constants'
import { UNGROUPED_GOALS_LABEL } from '../../goalGroupsModel'

interface GoalGroupSectionProps {
  groups: readonly GoalGroupDTO[]
  groupId: number | null
  onGroupIdChange: (groupId: number | null) => void
}

interface GoalGroupOption {
  id: number | null
  name: string
}

/**
 * 目標の所属グループ選択欄を表示する。
 *
 * @param props - グループ一覧、現在値、変更通知先。
 * @returns 所属グループのSelect要素。
 */
export const GoalGroupSection: Component<GoalGroupSectionProps> = (props) => {
  const options = createMemo<GoalGroupOption[]>(() => [
    ...props.groups.map(({ id, name }) => ({ id, name })),
    { id: null, name: UNGROUPED_GOALS_LABEL },
  ])
  const selectedOption = createMemo(
    () => options().find(({ id }) => id === props.groupId) ?? options()[options().length - 1]
  )

  return (
    <FormSelect<GoalGroupOption>
      label={GOAL_GROUP_COPY.fieldLabel}
      options={options()}
      value={selectedOption()}
      optionValue={(option) => String(option.id ?? 'ungrouped')}
      optionTextValue={(option) => option.name}
      formatLabel={(option) => option.name}
      onChange={(option) => props.onGroupIdChange(option?.id ?? null)}
    />
  )
}
