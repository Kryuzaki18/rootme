import { useState, type DragEvent } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  FolderPlus,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { usePresetsStore, type PresetGroup, type PresetItem } from '@/store/presetsStore'
import { useAppInstancesStore } from '@/store/appInstancesStore'
import { useToastStore } from '@/store/toastStore'
import { DRAG_MIME_TYPES } from '@/constants/drag.constant'
import { PRESET_GROUP_EXPORT_FILENAME_PREFIX } from '@/constants/preset.constant'
import { ICON_BUTTON_TOOLBAR } from '@/constants/iconButton.constant'
import type { DraggedAppInstanceEntry, DraggedAppInstancePayload, DraggedPresetGroupPayload } from '@/types/drag'
import { downloadJson } from '@/util'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useDragSource } from '@/hooks/useDragSource'
import { useDropTarget } from '@/hooks/useDropTarget'
import IconButton from '@/components/IconButton'
import DragGhost from '@/components/DragGhost'
import DragPreviewCard from '@/components/DragPreviewCard'
import PresetItemForm from './PresetItemForm'
import PresetItemRow from './PresetItemRow'

interface PresetGroupCardProps {
  group: PresetGroup
  initiallyCollapsed: boolean
  formState: { itemId: string | null } | null
  onToggleAddForm: (groupId: string) => void
  onEditStart: (groupId: string, itemId: string) => void
  onCloseForm: () => void
  isItemFocused: (item: PresetItem) => boolean
  toggleItemFocus: (item: PresetItem) => void
  isGroupFocused: (group: PresetGroup) => boolean
  toggleGroupFocus: (group: PresetGroup) => void
}

export default function PresetGroupCard({
  group,
  initiallyCollapsed,
  formState,
  onToggleAddForm,
  onEditStart,
  onCloseForm,
  isItemFocused,
  toggleItemFocus,
  isGroupFocused,
  toggleGroupFocus
}: PresetGroupCardProps) {
  const { deleteGroup, renameGroup, addItem, updateItemPid, reorderGroups } = usePresetsStore()
  const { saveEdit, clearInstanceSelection } = useAppInstancesStore()
  const { showToast } = useToastStore()
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState(group.title)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(isMenuOpen, () => setIsMenuOpen(false))

  const isFormOpen = formState !== null
  const isAddFormOpen = formState !== null && formState.itemId === null
  const editingItemId = formState?.itemId ?? null

  const isPidTaken = (pid: number, excludeItemId?: string) =>
    group.items.some((item) => item.id !== excludeItemId && item.pid === pid)

  // Multiple selected instances fill the group's existing preset item slots in order
  // (first item first), so a group needs at least as many items as instances selected.
  // Dropping a single instance keeps the old behavior of creating a new item for it.
  const handleInstanceDrop = async (instances: DraggedAppInstanceEntry[]) => {
    if (instances.length > 1) {
      if (group.items.length < instances.length) {
        showToast(
          `"${group.title || 'Group'}" has ${group.items.length} preset item${
            group.items.length === 1 ? '' : 's'
          }, but ${instances.length} instances are selected. Select fewer instances or add more preset items to this group.`,
          'error'
        )
        return
      }

      instances.forEach((instance, index) => {
        const item = group.items[index]
        updateItemPid(group.id, item.id, instance.pid)
        saveEdit(instance.pid, item.title, item.iconDataUrl)
        window.api.setWindowBounds(instance.pid, item.x, item.y, item.width, item.height)
      })
      clearInstanceSelection()
      return
    }

    const [instance] = instances
    const bounds = await window.api.getWindowBounds(instance.pid)
    addItem(group.id, {
      title: instance.title,
      iconDataUrl: instance.iconDataUrl,
      width: bounds?.width ?? 0,
      height: bounds?.height ?? 0,
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0,
      pid: isPidTaken(instance.pid) ? undefined : instance.pid
    })
    clearInstanceSelection()
  }

  const {
    isDragOver: isAppInstanceDragOver,
    dropHandlers: appInstanceDropHandlers,
    close: closeDragOver
  } = useDropTarget<DraggedAppInstancePayload>(DRAG_MIME_TYPES.APP_INSTANCE, (payload) =>
    handleInstanceDrop(payload.instances)
  )

  const { isDragging, dragHandlers } = useDragSource(
    DRAG_MIME_TYPES.PRESET_GROUP,
    () => ({ groupId: group.id }),
    'move'
  )

  const { isDragOver: isGroupDragOver, dropHandlers: groupDropHandlers } = useDropTarget<DraggedPresetGroupPayload>(
    DRAG_MIME_TYPES.PRESET_GROUP,
    (payload) => reorderGroups(payload.groupId, group.id),
    { stopPropagation: true, dropEffect: 'move' }
  )

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDragOver(event)
      groupDropHandlers.onDragOver(event)
    },
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDragEnter(event)
      groupDropHandlers.onDragEnter(event)
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDragLeave(event)
      groupDropHandlers.onDragLeave(event)
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDrop(event)
      groupDropHandlers.onDrop(event)
    }
  }

  const handleToggleAddForm = () => {
    setIsMenuOpen(false)
    onToggleAddForm(group.id)
    setIsCollapsed(false)
  }

  const handleRenameStart = () => {
    setIsMenuOpen(false)
    setRenameDraft(group.title)
    setIsRenaming(true)
  }

  const handleRenameSave = () => {
    renameGroup(group.id, renameDraft.trim())
    setIsRenaming(false)
  }

  const handleExportGroup = () => {
    setIsMenuOpen(false)
    if (group.items.length === 0) return
    downloadJson(`${PRESET_GROUP_EXPORT_FILENAME_PREFIX}${group.id}.json`, [group])
  }

  const handleToggleFocus = () => {
    setIsMenuOpen(false)
    toggleGroupFocus(group)
  }

  const handleDeleteGroup = () => {
    setIsMenuOpen(false)
    deleteGroup(group.id)
  }

  const groupPids = group.items.map((item) => item.pid).filter((pid): pid is number => pid !== undefined)
  const groupFocused = isGroupFocused(group)

  return (
    <>
      <div
        {...dropHandlers}
        className={`flex shrink-0 scale-100 flex-col gap-2 rounded-lg border p-3 mt-0.5 transition-all duration-150 ease-out dark:bg-zinc-900/20 ${
          isDragging ? 'opacity-40' : ''
        } ${
          isGroupDragOver
            ? 'scale-[1.015] border-dashed border-red-500 bg-red-50 shadow-lg shadow-red-500/10 ring-2 ring-red-300 dark:border-red-400 dark:bg-red-950/30 dark:ring-red-700'
            : isAppInstanceDragOver
              ? 'border-dashed border-red-500 ring-2 ring-red-300 dark:border-red-400 dark:ring-red-700'
              : 'border-zinc-200 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {isRenaming ? (
            <div className="flex flex-1 items-center gap-1">
              <input
                type="text"
                value={renameDraft}
                onChange={(event) => setRenameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleRenameSave()
                  if (event.key === 'Escape') setIsRenaming(false)
                }}
                placeholder="Group name"
                autoFocus
                className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900 transition-colors focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:ring-red-900/50"
              />
              <IconButton
                icon={Check}
                label="Save group name"
                onClick={handleRenameSave}
                className={ICON_BUTTON_TOOLBAR}
                iconClassName="h-3.5 w-3.5"
              />
              <IconButton
                icon={X}
                label="Cancel rename"
                onClick={() => setIsRenaming(false)}
                className={ICON_BUTTON_TOOLBAR}
                iconClassName="h-3.5 w-3.5"
              />
            </div>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              <span
                {...dragHandlers}
                role="button"
                aria-label="Drag to reorder group"
                title="Drag to reorder group"
                className="shrink-0 cursor-grab p-0.5 text-zinc-400 transition-colors active:cursor-grabbing hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
              >
                <GripVertical className="h-3.5 w-3.5" />
              </span>
              <IconButton
                icon={isCollapsed ? ChevronRight : ChevronDown}
                label={isCollapsed ? 'Expand group' : 'Collapse group'}
                onClick={() => setIsCollapsed((current) => !current)}
                className="shrink-0 rounded-full p-0.5 text-zinc-400 transition-all duration-150 hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                iconClassName="h-3.5 w-3.5"
              />
              <FolderPlus className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {group.title || 'Group'} ({group.items.length})
              </span>
            </span>
          )}

          {!isRenaming && (
            <div ref={menuRef} className="relative shrink-0">
              <IconButton
                icon={MoreHorizontal}
                label="Group actions"
                onClick={() => setIsMenuOpen((current) => !current)}
                className={ICON_BUTTON_TOOLBAR}
              />
              {isMenuOpen && (
                <div className="animate-dropdown-in absolute top-full right-0 z-20 mt-1 flex w-44 flex-col gap-0.5 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/30">
                  {[
                    { icon: Pencil, label: 'Rename group', onClick: handleRenameStart },
                    {
                      icon: groupFocused ? Eye : EyeOff,
                      label: groupFocused ? 'Send group to tray' : 'Focus group',
                      onClick: handleToggleFocus,
                      disabled: groupPids.length === 0
                    },
                    {
                      icon: Download,
                      label: 'Export group',
                      onClick: handleExportGroup,
                      disabled: group.items.length === 0
                    },
                    {
                      icon: isFormOpen ? X : Plus,
                      label: isFormOpen ? 'Cancel' : 'Add preset item',
                      onClick: () => {
                        setIsMenuOpen(false)
                        if (isFormOpen) onCloseForm()
                        else handleToggleAddForm()
                      }
                    },
                    { icon: Trash2, label: 'Delete group', onClick: handleDeleteGroup, danger: true }
                  ].map(({ icon: Icon, label, onClick, disabled, danger }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={onClick}
                      disabled={disabled}
                      title={label}
                      className={`flex w-full cursor-pointer items-center gap-2 rounded px-2.5 py-1.5 text-left text-xs transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
                        danger
                          ? 'text-red-600 hover:bg-red-50 disabled:hover:text-red-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:disabled:hover:text-red-400'
                          : 'text-zinc-600 hover:bg-red-50 hover:text-red-600 disabled:hover:text-zinc-600 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:disabled:hover:text-zinc-300'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!isCollapsed && isAddFormOpen && (
          <PresetItemForm
            isPidTaken={isPidTaken}
            onSubmit={(values) => {
              addItem(group.id, values)
              onCloseForm()
            }}
            onCancel={onCloseForm}
            wrapperClassName="rounded-lg border border-zinc-200 dark:border-zinc-800"
          />
        )}

        {!isCollapsed && group.items.length === 0 && !isFormOpen && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No presets in this group yet.
          </p>
        )}

        {!isCollapsed && group.items.length > 0 && (
          // No gap here: each PresetItemRow supplies its own bottom padding as part of
          // its drop-target hit box, so there's no dead zone between rows while reordering.
          <div className="flex flex-col">
            {group.items.map((item) => (
              <PresetItemRow
                key={item.id}
                groupId={group.id}
                item={item}
                isEditing={editingItemId === item.id}
                isFocused={isItemFocused(item)}
                isPidTaken={isPidTaken}
                onEditToggle={() => (editingItemId === item.id ? onCloseForm() : onEditStart(group.id, item.id))}
                onDropSettled={closeDragOver}
                onToggleFocus={() => toggleItemFocus(item)}
                onInstanceDrop={handleInstanceDrop}
              />
            ))}
          </div>
        )}
      </div>

      <DragGhost active={isDragging}>
        <DragPreviewCard title={group.title || 'Group'} />
      </DragGhost>
    </>
  )
}
