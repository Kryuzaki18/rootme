import { useState } from 'react'
import { Plus, ImagePlus, Check, X, Trash2, Pencil } from 'lucide-react'
import { usePresetsStore, type Preset } from '../../../store/presetsStore'
import { initials } from '../../../util'

export default function Presets() {
  const { presets, savePreset, updatePreset, deletePreset } = usePresetsStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const handleFormToggle = () => {
    resetDraft()
    setEditingId(null)
    setFormOpen((value) => !value)
  }

  const handleEditStart = (preset: Preset) => {
    setTitleDraft(preset.title)
    setIconDraft(preset.iconDataUrl)
    setWidthDraft(String(preset.width))
    setHeightDraft(String(preset.height))
    setXDraft(String(preset.x))
    setYDraft(String(preset.y))
    setEditingId(preset.id)
    setFormOpen(true)
  }

  const handlePickIcon = async () => {
    const result = await window.api.pickIconFile()
    if (result) setIconDraft(result.dataUrl)
  }

  const handleSave = () => {
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

    if (editingId) {
      updatePreset(editingId, values)
    } else {
      savePreset(values)
    }

    resetDraft()
    setEditingId(null)
    setFormOpen(false)
  }

  return (
    <section className="flex w-64 shrink-0 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-green-900 dark:text-green-100">Presets</h2>
        <button
          type="button"
          onClick={handleFormToggle}
          className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
          aria-label={formOpen ? 'Cancel' : 'Add preset'}
        >
          {formOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>

      {formOpen && (
        <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800 dark:bg-green-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePickIcon}
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-green-400 text-green-600 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
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
              onKeyDown={(event) => event.key === 'Enter' && handleSave()}
              placeholder="Preset name"
              className="flex-1 rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
              Width
              <input
                type="number"
                value={widthDraft}
                onChange={(event) => setWidthDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSave()}
                placeholder="Width"
                className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
              Height
              <input
                type="number"
                value={heightDraft}
                onChange={(event) => setHeightDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSave()}
                placeholder="Height"
                className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
              X
              <input
                type="number"
                value={xDraft}
                onChange={(event) => setXDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSave()}
                placeholder="X"
                className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
              Y
              <input
                type="number"
                value={yDraft}
                onChange={(event) => setYDraft(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleSave()}
                placeholder="Y"
                className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!titleDraft.trim()}
            className="flex items-center justify-center gap-2 rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-600 dark:hover:bg-green-500"
          >
            <Check className="h-4 w-4" />
            {editingId ? 'Save changes' : 'Save preset'}
          </button>
        </div>
      )}

      {presets.length === 0 && !formOpen && (
        <p className="rounded-lg border border-dashed border-green-300 px-4 py-6 text-center text-sm text-green-600 dark:border-green-800 dark:text-green-400">
          No presets saved yet.
        </p>
      )}

      {presets.map((preset) => (
        <div
          key={preset.id}
          className="flex items-center gap-3 overflow-hidden rounded-lg border border-green-200 bg-white px-3 py-2.5 dark:border-green-800 dark:bg-green-900/30"
        >
          {preset.iconDataUrl ? (
            <img src={preset.iconDataUrl} alt="" className="h-7 w-7 shrink-0 rounded object-cover" />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-800 dark:text-green-200">
              {initials(preset.title)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-green-950 dark:text-green-50">{preset.title}</p>
            <p className="truncate text-xs text-green-600 dark:text-green-400">
              {preset.width}×{preset.height} at ({preset.x}, {preset.y})
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleEditStart(preset)}
            className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
            aria-label="Edit preset"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => deletePreset(preset.id)}
            className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
            aria-label="Delete preset"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </section>
  )
}
