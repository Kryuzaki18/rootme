import { useState } from 'react'
import { Eye, EyeOff, Focus, Pencil, Check, X, Copy } from 'lucide-react'
import { useAppInstancesStore, type AppInstance } from '@/store/appInstancesStore'
import type { PresetItem } from '@/store/presetsStore'
import { DRAG_MIME_TYPES } from '@/constants/drag.constant'
import { MAX_APP_TITLE_LENGTH, MIN_APP_TITLE_LENGTH } from '@/constants/ui.constant'
import { ICON_BUTTON_COMPACT, ICON_BUTTON_EDIT_ACTION, ICON_BUTTON_ROW } from '@/constants/iconButton.constant'
import { parseWindowBoundsDraft } from '@/util'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useDragSource } from '@/hooks/useDragSource'
import { useDropTarget } from '@/hooks/useDropTarget'
import { useWindowBoundsDraft } from '@/hooks/useWindowBoundsDraft'
import IconButton from '@/components/IconButton'
import DragGhost from '@/components/DragGhost'
import DragPreviewCard from '@/components/DragPreviewCard'
import IconPickerField from './IconPickerField'
import WindowBoundsFields from './WindowBoundsFields'

export default function AppInstanceRow({ instance }: { instance: AppInstance }) {
  const { toggleVisibility, focusInstance, toggleEdit, saveEdit } = useAppInstancesStore()
  const [nameDraft, setNameDraft] = useState(instance.displayName)
  const [iconDraft, setIconDraft] = useState<string | undefined>(instance.iconDataUrl)
  const boundsDraft = useWindowBoundsDraft()
  const { copiedKey, copy } = useCopyToClipboard()

  const handlePickIcon = async () => {
    const result = await window.api.pickIconFile()
    if (result) setIconDraft(result.dataUrl)
  }

  const handleEditToggle = async () => {
    setNameDraft(instance.windowTitle)
    setIconDraft(instance.iconDataUrl)

    if (!instance.isEditing) {
      const bounds = await window.api.getWindowBounds(instance.pid)
      boundsDraft.setBounds(bounds)
    }

    toggleEdit(instance.pid)
  }

  const handleSave = () => {
    const title = nameDraft.trim()
    if (title.length < MIN_APP_TITLE_LENGTH || title.length > MAX_APP_TITLE_LENGTH) return
    saveEdit(instance.pid, title, iconDraft)

    const bounds = boundsDraft.parse()
    if (bounds) {
      window.api.setWindowBounds(instance.pid, bounds.x, bounds.y, bounds.width, bounds.height)
    }
  }

  const { isDragOver, dropHandlers } = useDropTarget<PresetItem>(DRAG_MIME_TYPES.PRESET_ITEM, (preset) => {
    saveEdit(instance.pid, preset.title, preset.iconDataUrl)
    window.api.setWindowBounds(instance.pid, preset.x, preset.y, preset.width, preset.height)
  })

  const { isDragging, dragHandlers } = useDragSource(DRAG_MIME_TYPES.APP_INSTANCE, () => ({
    pid: instance.pid,
    title: instance.windowTitle || instance.displayName,
    iconDataUrl: instance.iconDataUrl
  }))

  return (
    <>
      <div
        {...dragHandlers}
        {...dropHandlers}
        className={`row-enter shrink-0 cursor-grab overflow-hidden rounded-lg border bg-white transition duration-150 active:cursor-grabbing dark:bg-green-900/30 ${
          isDragging ? 'opacity-40' : ''
        } ${
          isDragOver
            ? 'border-dashed border-green-500 ring-2 ring-green-300 dark:border-green-400 dark:ring-green-700'
            : 'border-green-200 dark:border-green-800'
        }`}
      >
        <div className="flex items-center gap-10 px-4 py-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 font-mono text-[9px] text-green-700 dark:text-green-300">
              PID {instance.pid}
              <IconButton
                icon={copiedKey === 'pid' ? Check : Copy}
                label="Copy PID"
                onClick={() => copy('pid', String(instance.pid))}
                className={ICON_BUTTON_COMPACT}
                iconClassName="h-2.5 w-2.5"
              />
            </span>
            <span className="font-mono text-[9px] text-green-700 dark:text-green-300">
              Memory {instance.memUsage}
            </span>
          </div>

          <div>
            {instance.iconDataUrl ? (
              <div className="flex items-center gap-2">
                <img src={instance.iconDataUrl} alt="" className="h-7 w-7 rounded object-cover" />
                <span className="font-normal">{instance.windowTitle}</span>
              </div>
            ) : (
              <span className="font-normal text-xs">
                {instance.windowTitle} ({instance.imageName})
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-1">
            <IconButton
              icon={Focus}
              label="Show and focus"
              onClick={() => focusInstance(instance.pid)}
              className={ICON_BUTTON_ROW}
            />

            <IconButton
              icon={instance.isVisible ? Eye : EyeOff}
              label={instance.isVisible ? 'Minimize' : 'Show'}
              onClick={() => toggleVisibility(instance.pid)}
              className={ICON_BUTTON_ROW}
            />

            <IconButton icon={Pencil} label="Edit" onClick={handleEditToggle} className={ICON_BUTTON_ROW} />
          </div>
        </div>

        {instance.isEditing && (
          <div className="flex flex-col gap-2 border-t border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/60">
            <div className="flex gap-2">
              <IconPickerField
                iconDataUrl={iconDraft}
                onPick={handlePickIcon}
                ariaLabel="Update app icon"
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-green-400 text-green-600 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
              />

              <div className="flex flex-1 flex-col gap-0.5">
                <input
                  type="text"
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleSave()}
                  placeholder="Update app name"
                  maxLength={MAX_APP_TITLE_LENGTH}
                  className="w-full rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
                />
                <span className="self-end text-[10px] text-green-600 dark:text-green-400">
                  {nameDraft.trim().length}/{MAX_APP_TITLE_LENGTH}
                </span>
              </div>

              <IconButton icon={Check} label="Save" onClick={handleSave} className={ICON_BUTTON_EDIT_ACTION} />
              <IconButton
                icon={X}
                label="Cancel"
                onClick={() => toggleEdit(instance.pid)}
                className={ICON_BUTTON_EDIT_ACTION}
              />
            </div>

            <WindowBoundsFields
              {...boundsDraft.fields}
              onEnter={handleSave}
              gridClassName="grid grid-cols-4 gap-2 pl-10"
              inputClassName="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
            />
          </div>
        )}
      </div>

      <DragGhost active={isDragging}>
        <DragPreviewCard iconDataUrl={instance.iconDataUrl} title={instance.windowTitle || instance.displayName} />
      </DragGhost>
    </>
  )
}
