import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { PresetItem } from '@/store/presetsStore'
import { MAX_APP_TITLE_LENGTH, MIN_APP_TITLE_LENGTH } from '@/constants/ui.constant'
import { useWindowBoundsDraft } from '@/hooks/useWindowBoundsDraft'
import IconButton from '@/components/IconButton'
import IconPickerField from './IconPickerField'
import WindowBoundsFields from './WindowBoundsFields'

interface PresetItemFormProps {
  initialItem?: PresetItem
  isPidTaken: (pid: number, excludeItemId?: string) => boolean
  onSubmit: (values: Omit<PresetItem, 'id'>) => void
  onCancel: () => void
  wrapperClassName: string
}

export default function PresetItemForm({
  initialItem,
  isPidTaken,
  onSubmit,
  onCancel,
  wrapperClassName
}: PresetItemFormProps) {
  const [titleDraft, setTitleDraft] = useState(initialItem?.title ?? '')
  const [iconDraft, setIconDraft] = useState<string | undefined>(initialItem?.iconDataUrl)
  const [pidDraft, setPidDraft] = useState(initialItem?.pid !== undefined ? String(initialItem.pid) : '')
  const boundsDraft = useWindowBoundsDraft(initialItem)

  const handlePickIcon = async () => {
    const result = await window.api.pickIconFile()
    if (result) setIconDraft(result.dataUrl)
  }

  const trimmedTitle = titleDraft.trim()
  const isInvalidTitleLength =
    trimmedTitle.length < MIN_APP_TITLE_LENGTH || trimmedTitle.length > MAX_APP_TITLE_LENGTH
  const trimmedPid = pidDraft.trim()
  const parsedPid = trimmedPid ? Number(trimmedPid) : undefined
  const isInvalidPid = parsedPid !== undefined && !Number.isFinite(parsedPid)
  const isDuplicatePid =
    parsedPid !== undefined && Number.isFinite(parsedPid) && isPidTaken(parsedPid, initialItem?.id)

  const handleSave = () => {
    if (isInvalidTitleLength || isInvalidPid || isDuplicatePid) return

    const bounds = boundsDraft.parse()
    onSubmit({
      title: trimmedTitle,
      iconDataUrl: iconDraft,
      pid: parsedPid,
      width: bounds?.width ?? 0,
      height: bounds?.height ?? 0,
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0
    })
  }

  return (
    <div className={`flex flex-col gap-2 px-3 py-2.5 dark:bg-green-950/20 ${wrapperClassName}`}>
      <div className="flex gap-2">
        <IconPickerField
          iconDataUrl={iconDraft}
          onPick={handlePickIcon}
          ariaLabel="Choose preset icon"
          className="cursor-pointer flex h-8 w-8 p-0.5 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-green-400 text-green-600 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
        />

        <div className="flex flex-1 flex-col gap-0.5">
          <input
            type="text"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSave()}
            placeholder="Preset name"
            maxLength={MAX_APP_TITLE_LENGTH}
            className="w-full rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
          />
          <span className="self-end text-[10px] text-green-600 dark:text-green-400">
            {trimmedTitle.length}/{MAX_APP_TITLE_LENGTH}
          </span>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
        PID (optional)
        <div className="relative">
          <input
            type="number"
            value={pidDraft}
            onChange={(event) => setPidDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSave()}
            placeholder="Process ID"
            className={`w-full rounded border bg-white px-2 py-1 pr-7 text-sm text-green-950 focus:outline-none focus:ring-2 dark:bg-green-900/20 dark:text-green-50 ${
              isDuplicatePid || isInvalidPid
                ? 'border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600 dark:focus:ring-red-900'
                : 'border-green-300 focus:border-green-500 focus:ring-green-100 dark:border-green-700 dark:focus:ring-green-800'
            }`}
          />
          <IconButton
            icon={X}
            label="Clear PID"
            onClick={() => setPidDraft('')}
            disabled={!pidDraft}
            className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-green-500 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            iconClassName="h-3.5 w-3.5"
          />
        </div>
        {isDuplicatePid && (
          <span className="text-red-500 dark:text-red-400">This PID is already used in this group.</span>
        )}
      </label>

      <WindowBoundsFields
        {...boundsDraft.fields}
        onEnter={handleSave}
        gridClassName="grid grid-cols-2 gap-2"
        inputClassName="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isInvalidTitleLength || isDuplicatePid || isInvalidPid}
          title={initialItem ? 'Save changes' : 'Save preset'}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded bg-green-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {initialItem ? 'Save changes' : 'Save preset'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          title="Cancel"
          className="flex cursor-pointer items-center justify-center gap-2 rounded border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
