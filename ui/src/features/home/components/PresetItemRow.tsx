import type { DragEvent } from 'react'
import { Eye, EyeOff, Pencil, Trash2, X } from 'lucide-react'
import { usePresetsStore, type PresetItem } from '@/store/presetsStore'
import { useAppInstancesStore } from '@/store/appInstancesStore'
import { DRAG_MIME_TYPES } from '@/constants/drag.constant'
import { ICON_BUTTON_ROW } from '@/constants/iconButton.constant'
import type { DraggedAppInstanceEntry, DraggedAppInstancePayload, DraggedPresetItemPayload } from '@/types/drag'
import { useDragSource } from '@/hooks/useDragSource'
import { useDropTarget } from '@/hooks/useDropTarget'
import IconButton from '@/components/IconButton'
import DragGhost from '@/components/DragGhost'
import DragPreviewCard from '@/components/DragPreviewCard'
import AppAvatar from '@/components/AppAvatar'
import PresetItemForm from './PresetItemForm'

interface PresetItemRowProps {
  groupId: string
  item: PresetItem
  isEditing: boolean
  isFocused: boolean
  isPidTaken: (pid: number, excludeItemId?: string) => boolean
  onEditToggle: () => void
  onDropSettled: () => void
  onToggleFocus: () => void
  onInstanceDrop: (instances: DraggedAppInstanceEntry[]) => void
}

export default function PresetItemRow({
  groupId,
  item,
  isEditing,
  isFocused,
  isPidTaken,
  onEditToggle,
  onDropSettled,
  onToggleFocus,
  onInstanceDrop
}: PresetItemRowProps) {
  const { updateItem, updateItemPid, deleteItem, reorderItems } = usePresetsStore()
  const { saveEdit } = useAppInstancesStore()

  const { isDragging, dragHandlers } = useDragSource(
    DRAG_MIME_TYPES.PRESET_ITEM,
    () => ({ ...item, groupId }),
    'copyMove'
  )

  const {
    isDragOver: isAppInstanceDragOver,
    dropHandlers: appInstanceDropHandlers
  } = useDropTarget<DraggedAppInstancePayload>(
    DRAG_MIME_TYPES.APP_INSTANCE,
    (payload) => {
      onDropSettled()

      if (payload.instances.length > 1) {
        onInstanceDrop(payload.instances)
        return
      }

      const [instance] = payload.instances
      if (isPidTaken(instance.pid, item.id)) return

      updateItemPid(groupId, item.id, instance.pid)
      saveEdit(instance.pid, item.title, item.iconDataUrl)
      window.api.setWindowBounds(instance.pid, item.x, item.y, item.width, item.height)
    },
    { stopPropagation: true }
  )

  const { isDragOver: isItemDragOver, dropHandlers: itemDropHandlers } = useDropTarget<DraggedPresetItemPayload>(
    DRAG_MIME_TYPES.PRESET_ITEM,
    (payload) => {
      onDropSettled()
      if (payload.groupId !== groupId) return
      reorderItems(groupId, payload.id, item.id)
    },
    { stopPropagation: true, dropEffect: 'move' }
  )

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDragOver(event)
      itemDropHandlers.onDragOver(event)
    },
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDragEnter(event)
      itemDropHandlers.onDragEnter(event)
    },
    onDragLeave: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDragLeave(event)
      itemDropHandlers.onDragLeave(event)
    },
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      appInstanceDropHandlers.onDrop(event)
      itemDropHandlers.onDrop(event)
    }
  }

  return (
    <>
      {/* Drop handlers live on this padded wrapper (not just the visual card below) so
          hovering in the gap between item rows still counts as hovering this item. */}
      <div {...dropHandlers} className="shrink-0 pb-2 last:pb-0">
        <div
          className={`flex scale-100 flex-col overflow-hidden rounded-lg border bg-white transition-all duration-150 ease-out dark:bg-zinc-900/40 ${
            isDragging ? 'opacity-40' : ''
          } ${
            isItemDragOver
              ? 'scale-[1.015] border-dashed border-red-500 bg-red-50 shadow-lg shadow-red-500/10 ring-2 ring-red-300 dark:border-red-400 dark:bg-red-950/30 dark:ring-red-700'
              : isAppInstanceDragOver
                ? 'border-dashed border-red-500 ring-2 ring-red-300 dark:border-red-400 dark:ring-red-700'
                : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div {...dragHandlers} className="flex cursor-grab items-center gap-1 p-2 active:cursor-grabbing">
            <AppAvatar iconDataUrl={item.iconDataUrl} label={item.title} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</p>
              <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500">
                {item.pid !== undefined && `PID ${item.pid} - `}
                {item.width}×{item.height} at ({item.x}, {item.y})
              </p>
            </div>

            <IconButton
              icon={isFocused ? Eye : EyeOff}
              label={isFocused ? 'Send to tray' : 'Focus'}
              onClick={onToggleFocus}
              disabled={item.pid === undefined}
              className={ICON_BUTTON_ROW}
            />
            <IconButton
              icon={isEditing ? X : Pencil}
              label={isEditing ? 'Cancel edit' : 'Edit preset'}
              onClick={onEditToggle}
              className={ICON_BUTTON_ROW}
            />
            <IconButton
              icon={Trash2}
              label="Delete preset"
              onClick={() => deleteItem(groupId, item.id)}
              className={ICON_BUTTON_ROW}
            />
          </div>

          {isEditing && (
            <PresetItemForm
              initialItem={item}
              isPidTaken={isPidTaken}
              onSubmit={(values) => {
                updateItem(groupId, item.id, values)
                onEditToggle()
              }}
              onCancel={onEditToggle}
              wrapperClassName="border-t border-zinc-200 dark:border-zinc-800"
            />
          )}
        </div>
      </div>

      <DragGhost active={isDragging}>
        <DragPreviewCard iconDataUrl={item.iconDataUrl} title={item.title} />
      </DragGhost>
    </>
  )
}
