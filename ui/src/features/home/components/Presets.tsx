import { useRef, useState, type ChangeEvent } from 'react'
import { Download, Plus, Upload } from 'lucide-react'
import { usePresetsStore } from '@/store/presetsStore'
import { downloadJson } from '@/util'
import { DRAG_MIME_TYPES } from '@/constants/drag.constant'
import { PRESET_EXPORT_FILENAME } from '@/constants/preset.constant'
import { ICON_BUTTON_TOOLBAR, ICON_BUTTON_TOOLBAR_DISABLED } from '@/constants/iconButton.constant'
import { usePresetFocus } from '@/hooks/usePresetFocus'
import IconButton from '@/components/IconButton'
import PresetGroupCard from './PresetGroupCard'

interface ActiveForm {
  groupId: string
  itemId: string | null
}

export default function Presets() {
  const { groups, addGroup, importGroups } = usePresetsStore()
  const { isItemFocused, toggleItemFocus, isGroupFocused, toggleGroupFocus } = usePresetFocus()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null)
  const [initialGroupIds] = useState(() => new Set(groups.map((group) => group.id)))

  const handleToggleAddForm = (groupId: string) => {
    setActiveForm((current) =>
      current?.groupId === groupId && current.itemId === null ? null : { groupId, itemId: null }
    )
  }

  const handleEditStart = (groupId: string, itemId: string) => {
    setActiveForm({ groupId, itemId })
  }

  const handleCloseForm = () => setActiveForm(null)

  const handleExportAll = () => {
    if (groups.length === 0) return
    downloadJson(PRESET_EXPORT_FILENAME, groups)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const text = await file.text()
      importGroups(JSON.parse(text))
    } catch {
      // ignore invalid file
    }
  }

  return (
    <section className="flex h-full w-100 shrink-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold text-green-900 dark:text-green-100">Presets</h2>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={DRAG_MIME_TYPES.PRESET_ITEM}
            className="hidden"
            onChange={handleImportChange}
          />
          <IconButton icon={Upload} label="Import presets" onClick={handleImportClick} className={ICON_BUTTON_TOOLBAR} />
          <IconButton
            icon={Download}
            label="Export presets"
            onClick={handleExportAll}
            disabled={groups.length === 0}
            className={ICON_BUTTON_TOOLBAR_DISABLED}
          />
          <IconButton icon={Plus} label="Add preset group" onClick={() => addGroup()} className={ICON_BUTTON_TOOLBAR} />
        </div>
      </div>

      <div className="app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed border-green-300 px-4 py-6 text-center text-sm text-green-600 dark:border-green-800 dark:text-green-400">
            No preset groups yet.
          </p>
        )}

        {groups.map((group) => (
          <PresetGroupCard
            key={group.id}
            group={group}
            initiallyCollapsed={initialGroupIds.has(group.id)}
            formState={activeForm?.groupId === group.id ? { itemId: activeForm.itemId } : null}
            onToggleAddForm={handleToggleAddForm}
            onEditStart={handleEditStart}
            onCloseForm={handleCloseForm}
            isItemFocused={isItemFocused}
            toggleItemFocus={toggleItemFocus}
            isGroupFocused={isGroupFocused}
            toggleGroupFocus={toggleGroupFocus}
          />
        ))}
      </div>
    </section>
  )
}
