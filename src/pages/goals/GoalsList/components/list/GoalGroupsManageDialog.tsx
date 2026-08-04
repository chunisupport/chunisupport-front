import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Dialog } from '@kobalte/core/dialog'
import { TextField } from '@kobalte/core/text-field'
import {
  closestCenter,
  createSortable,
  DragDropProvider,
  DragDropSensors,
  type DragEvent,
  SortableProvider,
  useDragDropContext,
} from '@thisbeyond/solid-dnd'
import { Check, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
import { AppButton, AppIconButton } from '../../../../../components/common/AppButton'
import type { GoalGroupDTO } from '../../../../../types/api'
import {
  buildGoalGroupDeleteDescription,
  buildGoalGroupDeleteLabel,
  buildGoalGroupDragLabel,
  buildGoalGroupEditLabel,
  buildGoalGroupLimitMessage,
  buildGoalGroupReorderAnnouncement,
  GOAL_GROUP_COPY,
} from '../../constants'
import {
  GOAL_GROUP_NAME_MAX_LENGTH,
  GOAL_GROUPS_LIMIT,
  validateGoalGroupName,
} from '../../goalGroupsModel'

interface GoalGroupsManageDialogProps {
  open: boolean
  groups: readonly GoalGroupDTO[]
  isMutating: boolean
  errorMessage: string
  onOpenChange: (open: boolean) => void
  onCreate: (name: string) => Promise<void>
  onUpdate: (group: GoalGroupDTO, name: string) => Promise<void>
  onDelete: (group: GoalGroupDTO) => Promise<void>
  onReorder: (activeId: number, overId: number) => void
}

interface SortableGroupRowProps {
  group: GoalGroupDTO
  position: number
  total: number
  editing: boolean
  editingName: string
  editingError: string
  isMutating: boolean
  onEditingNameChange: (name: string) => void
  onEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onKeyboardMove: (offset: -1 | 1) => void
}

/** グループ並び替え時に適用するY軸制約transformerのID。 */
const VERTICAL_AXIS_CONSTRAINT_ID = 'goal-groups-vertical-axis-constraint'

/**
 * グループのドラッグ変位をY軸だけに制限する。
 *
 * @returns 描画要素なし（ドラッグ中のtransformer登録のみ）。
 */
const VerticalAxisConstraint: Component = () => {
  const context = useDragDropContext()
  if (!context) return null

  const [state, { addTransformer, removeTransformer, onDragStart, onDragEnd }] = context

  onDragStart(({ draggable }) => {
    addTransformer('draggables', draggable.id, {
      id: VERTICAL_AXIS_CONSTRAINT_ID,
      order: 10,
      callback: (transform) => ({ x: 0, y: transform.y }),
    })
  })

  onDragEnd(({ draggable }) => {
    removeTransformer('draggables', draggable.id, VERTICAL_AXIS_CONSTRAINT_ID)
  })

  onCleanup(() => {
    const draggableId = state.active.draggableId
    if (draggableId !== null) {
      removeTransformer('draggables', draggableId, VERTICAL_AXIS_CONSTRAINT_ID)
    }
  })

  return null
}

/**
 * 管理ダイアログ内の並び替え可能なグループ行を表示する。
 *
 * @param props - グループ、編集状態、操作ハンドラ。
 * @returns 目標グループ行。
 */
const SortableGroupRow: Component<SortableGroupRowProps> = (props) => {
  const sortable = createSortable(props.group.id)
  let dragHandle: HTMLButtonElement | undefined

  createEffect(() => {
    if (!dragHandle) return
    const entries = Object.entries(sortable.dragActivators).map(([handlerName, listener]) => [
      handlerName.startsWith('on') ? handlerName.slice(2) : handlerName,
      listener as EventListener,
    ]) as Array<[string, EventListener]>

    for (const [eventName, listener] of entries) dragHandle.addEventListener(eventName, listener)
    onCleanup(() => {
      for (const [eventName, listener] of entries)
        dragHandle?.removeEventListener(eventName, listener)
    })
  })

  /**
   * 上下矢印キーでグループを1件移動する。
   *
   * @param event - ドラッグハンドルで発生したキーボードイベント。
   * @returns なし。
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (props.isMutating || props.editing) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      props.onKeyboardMove(-1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      props.onKeyboardMove(1)
    }
  }

  return (
    <div
      ref={sortable.ref}
      style={{ transform: `translate3d(${sortable.transform.x}px, ${sortable.transform.y}px, 0)` }}
      class={`flex items-center gap-2 rounded border border-border bg-surface p-2 ${
        sortable.isActiveDraggable ? 'relative z-10 opacity-80 shadow-lg' : ''
      }`}
    >
      <AppIconButton
        ref={(element: HTMLButtonElement) => {
          dragHandle = element
        }}
        aria-label={buildGoalGroupDragLabel(props.group.name, props.position, props.total)}
        aria-roledescription={GOAL_GROUP_COPY.sortableRoleDescription}
        disabled={props.isMutating || props.editing}
        tone="ghost"
        class="shrink-0 touch-none cursor-grab active:cursor-grabbing"
        onKeyDown={handleKeyDown}
      >
        <GripVertical size={18} aria-hidden="true" />
      </AppIconButton>

      <Show
        when={props.editing}
        fallback={<span class="min-w-0 flex-1 truncate font-sans">{props.group.name}</span>}
      >
        <TextField
          class="min-w-0 flex-1"
          value={props.editingName}
          onChange={props.onEditingNameChange}
        >
          <TextField.Label class="sr-only">{GOAL_GROUP_COPY.nameLabel}</TextField.Label>
          <TextField.Input
            maxLength={GOAL_GROUP_NAME_MAX_LENGTH}
            class="w-full rounded border border-border-strong bg-surface px-3 py-2 font-sans text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
          />
          <Show when={props.editingError}>
            <TextField.ErrorMessage class="mt-1 text-xs text-danger">
              {props.editingError}
            </TextField.ErrorMessage>
          </Show>
        </TextField>
      </Show>

      <Show
        when={props.editing}
        fallback={
          <>
            <AppIconButton
              aria-label={buildGoalGroupEditLabel(props.group.name)}
              disabled={props.isMutating}
              tone="ghost"
              onClick={props.onEdit}
            >
              <Pencil size={17} aria-hidden="true" />
            </AppIconButton>
            <AppIconButton
              aria-label={buildGoalGroupDeleteLabel(props.group.name)}
              disabled={props.isMutating}
              tone="danger"
              onClick={props.onDelete}
            >
              <Trash2 size={17} aria-hidden="true" />
            </AppIconButton>
          </>
        }
      >
        <AppIconButton
          aria-label={GOAL_GROUP_COPY.editCancelAction}
          disabled={props.isMutating}
          tone="ghost"
          onClick={props.onCancelEdit}
        >
          <X size={18} aria-hidden="true" />
        </AppIconButton>
        <AppIconButton
          aria-label={GOAL_GROUP_COPY.saveAction}
          disabled={props.isMutating}
          tone="primary"
          onClick={props.onSaveEdit}
        >
          <Check size={18} aria-hidden="true" />
        </AppIconButton>
      </Show>
    </div>
  )
}

/**
 * 目標グループの作成・改名・削除・並び替えを行うダイアログを表示する。
 *
 * @param props - グループ一覧、処理状態、各更新処理。
 * @returns 目標グループ管理ダイアログ。
 */
export const GoalGroupsManageDialog: Component<GoalGroupsManageDialogProps> = (props) => {
  const [newName, setNewName] = createSignal('')
  const [editingGroupId, setEditingGroupId] = createSignal<number>()
  const [editingName, setEditingName] = createSignal('')
  const [deletingGroup, setDeletingGroup] = createSignal<GoalGroupDTO>()
  const [validationError, setValidationError] = createSignal('')
  const [reorderAnnouncement, setReorderAnnouncement] = createSignal('')

  createEffect(() => {
    if (!props.open) return
    setNewName('')
    setEditingGroupId(undefined)
    setEditingName('')
    setDeletingGroup(undefined)
    setValidationError('')
    setReorderAnnouncement('')
  })

  /**
   * 新しいグループ名を検証して作成する。
   *
   * @returns 作成処理完了後に解決されるPromise。
   */
  const handleCreate = async (): Promise<void> => {
    const error = validateGoalGroupName(newName(), props.groups)
    setValidationError(error)
    if (error) return
    try {
      await props.onCreate(newName().trim())
    } catch {
      return
    }
    setNewName('')
  }

  /**
   * 編集中のグループ名を検証して保存する。
   *
   * @returns 更新処理完了後に解決されるPromise。
   */
  const handleUpdate = async (): Promise<void> => {
    const group = props.groups.find(({ id }) => id === editingGroupId())
    if (!group) return
    const error = validateGoalGroupName(editingName(), props.groups, group.id)
    setValidationError(error)
    if (error) return
    try {
      await props.onUpdate(group, editingName().trim())
    } catch {
      return
    }
    setEditingGroupId(undefined)
    setEditingName('')
  }

  /**
   * ドロップ終了時にグループ順の更新を通知する。
   *
   * @param event - ドラッグ元とドロップ先を含む終了イベント。
   * @returns なし。
   */
  const handleDragEnd = (event: DragEvent): void => {
    if (props.isMutating || !event.droppable) return
    handleReorder(Number(event.draggable.id), Number(event.droppable.id))
  }

  /**
   * グループ並び替えを通知し、移動結果を読み上げる。
   *
   * @param activeId - 移動するグループID。
   * @param overId - 移動先のグループID。
   * @returns なし。
   */
  const handleReorder = (activeId: number, overId: number): void => {
    const group = props.groups.find(({ id }) => id === activeId)
    const destinationIndex = props.groups.findIndex(({ id }) => id === overId)
    if (!group || destinationIndex < 0 || activeId === overId) return
    setReorderAnnouncement(
      buildGoalGroupReorderAnnouncement(group.name, destinationIndex + 1, props.groups.length)
    )
    props.onReorder(activeId, overId)
  }

  return (
    <>
      <Dialog
        open={props.open}
        onOpenChange={(open) => {
          if (!open && props.isMutating) return
          props.onOpenChange(open)
        }}
        preventScroll={false}
      >
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
          <Dialog.Content class="fixed inset-x-4 top-1/2 z-70 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:h-128 sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:p-6">
            <Dialog.Title class="shrink-0 text-lg font-bold">
              {GOAL_GROUP_COPY.manageDialogTitle}
            </Dialog.Title>

            <div class="mt-4 shrink-0">
              <TextField value={newName()} onChange={setNewName}>
                <TextField.Label class="mb-1 block text-sm text-text-muted">
                  {GOAL_GROUP_COPY.newNameLabel}
                </TextField.Label>
                <div class="flex gap-2">
                  <TextField.Input
                    maxLength={GOAL_GROUP_NAME_MAX_LENGTH}
                    class="min-w-0 flex-1 rounded border border-border-strong bg-surface px-3 py-2 font-sans text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring"
                  />
                  <AppButton
                    variant="primary"
                    leftIcon={<Plus size={17} aria-hidden="true" />}
                    disabled={props.isMutating || props.groups.length >= GOAL_GROUPS_LIMIT}
                    onClick={() => void handleCreate()}
                  >
                    {GOAL_GROUP_COPY.addAction}
                  </AppButton>
                </div>
              </TextField>
              <Show when={props.groups.length >= GOAL_GROUPS_LIMIT}>
                <p class="mt-1 text-xs text-warning">
                  {buildGoalGroupLimitMessage(GOAL_GROUPS_LIMIT)}
                </p>
              </Show>
              <Show when={!editingGroupId() && (validationError() || props.errorMessage)}>
                <p class="mt-2 text-sm text-danger" role="alert">
                  {validationError() || props.errorMessage}
                </p>
              </Show>
            </div>

            <div class="scrollbar-none mt-4 min-h-0 flex-1 basis-0 overflow-y-auto pr-1">
              <Show
                when={props.groups.length > 0}
                fallback={
                  <p class="rounded border border-border p-4 text-sm text-text-muted">
                    {GOAL_GROUP_COPY.emptyMessage}
                  </p>
                }
              >
                <DragDropProvider collisionDetector={closestCenter} onDragEnd={handleDragEnd}>
                  <DragDropSensors>
                    <VerticalAxisConstraint />
                    <SortableProvider ids={props.groups.map(({ id }) => id)}>
                      <div class="space-y-2">
                        <For each={props.groups}>
                          {(group, index) => (
                            <SortableGroupRow
                              group={group}
                              position={index() + 1}
                              total={props.groups.length}
                              editing={editingGroupId() === group.id}
                              editingName={editingName()}
                              editingError={
                                editingGroupId() === group.id
                                  ? validationError() || props.errorMessage
                                  : ''
                              }
                              isMutating={props.isMutating}
                              onEditingNameChange={setEditingName}
                              onEdit={() => {
                                setValidationError('')
                                setEditingGroupId(group.id)
                                setEditingName(group.name)
                              }}
                              onCancelEdit={() => {
                                setValidationError('')
                                setEditingGroupId(undefined)
                              }}
                              onSaveEdit={() => void handleUpdate()}
                              onDelete={() => setDeletingGroup(group)}
                              onKeyboardMove={(offset) => {
                                const destination = props.groups[index() + offset]
                                if (destination) handleReorder(group.id, destination.id)
                              }}
                            />
                          )}
                        </For>
                      </div>
                    </SortableProvider>
                  </DragDropSensors>
                </DragDropProvider>
              </Show>
            </div>

            <p class="sr-only" role="status" aria-live="polite">
              {reorderAnnouncement()}
            </p>

            <div class="mt-5 flex shrink-0 justify-end">
              <AppButton disabled={props.isMutating} onClick={() => props.onOpenChange(false)}>
                {GOAL_GROUP_COPY.closeAction}
              </AppButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>

      <AlertDialog
        open={deletingGroup() !== undefined}
        onOpenChange={(open) => {
          if (!open && props.isMutating) return
          if (!open) setDeletingGroup(undefined)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay class="fixed inset-0 z-80 bg-overlay" />
          <AlertDialog.Content class="fixed left-1/2 top-1/2 z-90 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
            <AlertDialog.Title class="text-lg font-bold">
              {GOAL_GROUP_COPY.deleteDialogTitle}
            </AlertDialog.Title>
            <AlertDialog.Description class="mt-2 text-sm text-text-muted">
              {buildGoalGroupDeleteDescription(deletingGroup()?.name ?? '')}
            </AlertDialog.Description>
            <Show when={props.errorMessage}>
              <p class="mt-2 text-sm text-danger" role="alert">
                {props.errorMessage}
              </p>
            </Show>
            <div class="mt-5 flex justify-end gap-2">
              <AppButton disabled={props.isMutating} onClick={() => setDeletingGroup(undefined)}>
                {GOAL_GROUP_COPY.cancelAction}
              </AppButton>
              <AppButton
                variant="danger"
                disabled={props.isMutating}
                onClick={() => {
                  const group = deletingGroup()
                  if (!group) return
                  void props
                    .onDelete(group)
                    .then(() => setDeletingGroup(undefined))
                    .catch(() => undefined)
                }}
              >
                {GOAL_GROUP_COPY.deleteAction}
              </AppButton>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </>
  )
}
