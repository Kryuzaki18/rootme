import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Plus, ImagePlus, Check, X, Trash2, Pencil, FolderPlus, Download, Upload } from 'lucide-react'
import { usePresetsStore, type PresetGroup, type PresetItem } from '../../../store/presetsStore'
import { initials } from '../../../util'

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function Presets() {
  const { groups, addGroup, deleteGroup, addItem, updateItem, deleteItem, importGroups } = usePresetsStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [iconDraft, setIconDraft] = useState<string | undefined>(undefined)
  const [widthDraft, setWidthDraft] = useState('')
  const [heightDraft, setHeightDraft] = useState('')
  const [xDraft, setXDraft] = useState('')
  const [yDraft, setYDraft] = useState('')

  const resetDraft = () => {
    setTitleDraft('')
    setIconDraft(undefined)
    setWidthDraft('')
    setHeightDraft('')
    setXDraft('')
    setYDraft('')
  }

  const handleItemFormToggle = (groupId: string) => {
    resetDraft()
    setEditingItemId(null)
    setOpenGroupId((current) => (current === groupId ? null : groupId))
  }

  const handleEditStart = (groupId: string, item: PresetItem) => {
    setTitleDraft(item.title)
    setIconDraft(item.iconDataUrl)
    setWidthDraft(String(item.width))
    setHeightDraft(String(item.height))
    setXDraft(String(item.x))
    setYDraft(String(item.y))
    setEditingItemId(item.id)
    setOpenGroupId(groupId)
  }

  const handlePickIcon = async () => {
    const result = await window.api.pickIconFile()
    if (result) setIconDraft(result.dataUrl)
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, item: PresetItem) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/json', JSON.stringify(item))
  }

  const handleExportAll = () => {
    downloadJson('rootme-presets.json', groups)
  }

  const handleExportGroup = (group: PresetGroup) => {
    downloadJson(`rootme-preset-group-${group.id}.json`, [group])
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

  const handleSave = (groupId: string) => {
    if (!titleDraft.trim()) return

    const width = Number(widthDraft)
    const height = Number(heightDraft)
    const x = Number(xDraft)
    const y = Number(yDraft)
    const hasValidBounds = [width, height, x, y].every((value) => Number.isFinite(value))

    const values = {
      title: titleDraft.trim(),
      iconDataUrl: iconDraft,
      width: hasValidBounds ? width : 0,
      height: hasValidBounds ? height : 0,
      x: hasValidBounds ? x : 0,
      y: hasValidBounds ? y : 0
    }

    if (editingItemId) {
      updateItem(groupId, editingItemId, values)
    } else {
      addItem(groupId, values)
    }

    resetDraft()
    setEditingItemId(null)
    setOpenGroupId(null)
  }

  return (
    <section className="flex h-full w-100 shrink-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold text-green-900 dark:text-green-100">Presets</h2>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportChange}
          />
          <button
            type="button"
            onClick={handleImportClick}
            className="cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
            aria-label="Import presets"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleExportAll}
            className="cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
            aria-label="Export presets"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => addGroup()}
            className="cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
            aria-label="Add preset group"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed border-green-300 px-4 py-6 text-center text-sm text-green-600 dark:border-green-800 dark:text-green-400">
            No preset groups yet.
          </p>
        )}

        {groups.map((group) => {
          const formOpen = openGroupId === group.id

          return (
          <div
            key={group.id}
            className="flex shrink-0 flex-col gap-2 rounded-lg border border-green-200 p-3 dark:border-green-800 dark:bg-green-950/10"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                <FolderPlus className="h-3.5 w-3.5" />
                Group ({group.items.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleExportGroup(group)}
                  className="cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                  aria-label="Export group"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleItemFormToggle(group.id)}
                  className="cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                  aria-label={formOpen ? 'Cancel' : 'Add preset item'}
                >
                  {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => deleteGroup(group.id)}
                  className="cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                  aria-label="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {formOpen && (
              <div className="flex flex-col gap-2 rounded-lg border border-green-200 px-3 py-2.5 dark:border-green-800 dark:bg-green-950/20">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePickIcon}
                    className="cursor-pointer flex h-8 w-8 p-0.5 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-green-400 text-green-600 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
                    aria-label="Choose preset icon"
                  >
                    {iconDraft ? (
                      <img src={iconDraft} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleSave(group.id)}
                    placeholder="Preset name"
                    className="flex-1 rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
                    Width
                    <input
                      type="number"
                      value={widthDraft}
                      onChange={(event) => setWidthDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleSave(group.id)}
                      placeholder="Width"
                      className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
                    Height
                    <input
                      type="number"
                      value={heightDraft}
                      onChange={(event) => setHeightDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleSave(group.id)}
                      placeholder="Height"
                      className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
                    X
                    <input
                      type="number"
                      value={xDraft}
                      onChange={(event) => setXDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleSave(group.id)}
                      placeholder="X"
                      className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
                    Y
                    <input
                      type="number"
                      value={yDraft}
                      onChange={(event) => setYDraft(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleSave(group.id)}
                      placeholder="Y"
                      className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleSave(group.id)}
                  disabled={!titleDraft.trim()}
                  className="cursor-pointer flex items-center justify-center gap-2 rounded bg-green-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {editingItemId ? 'Save changes' : 'Save preset'}
                </button>
              </div>
            )}

            {group.items.length === 0 && !formOpen && (
              <p className="rounded-lg border border-dashed border-green-300 px-4 py-4 text-center text-xs text-green-600 dark:border-green-800 dark:text-green-400">
                No presets in this group yet.
              </p>
            )}

            {group.items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(event) => handleDragStart(event, item)}
                className="flex shrink-0 cursor-grab items-center gap-3 overflow-hidden rounded-lg border border-green-200 bg-white px-3 py-2.5 active:cursor-grabbing dark:border-green-800 dark:bg-green-900/30"
              >
                {item.iconDataUrl ? (
                  <img src={item.iconDataUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-800 dark:text-green-200">
                    {initials(item.title)}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-green-950 dark:text-green-50">{item.title}</p>
                  <p className="truncate text-xs text-green-600 dark:text-green-400">
                    {item.width}×{item.height} at ({item.x}, {item.y})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleEditStart(group.id, item)}
                  className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
                  aria-label="Edit preset"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteItem(group.id, item.id)}
                  className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
                  aria-label="Delete preset"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          )
        })}
      </div>
    </section>
  )
}
