import { useState, type DragEvent } from "react";
import { Eye, EyeOff, Focus, Pencil, Check, X, Copy } from "lucide-react";
import {
  useAppInstancesStore,
  type AppInstance,
} from "../../../store/appInstancesStore";
import type { PresetItem } from "../../../store/presetsStore";
import { DRAG_MIME_TYPES } from "../../../constants/drag.constant";
import {
  MAX_APP_TITLE_LENGTH,
  MIN_APP_TITLE_LENGTH,
  PID_COPIED_RESET_MS,
} from "../../../constants/ui.constant";
import { initials, parseWindowBoundsDraft, suppressDefaultDragImage } from "../../../util";
import IconButton from "../../../components/IconButton";
import DragGhost from "../../../components/DragGhost";
import IconPickerField from "./IconPickerField";
import WindowBoundsFields from "./WindowBoundsFields";

export default function AppInstanceRow({
  instance,
}: {
  instance: AppInstance;
}) {
  const { toggleVisibility, focusInstance, toggleEdit, saveEdit } =
    useAppInstancesStore();
  const [nameDraft, setNameDraft] = useState(instance.displayName);
  const [iconDraft, setIconDraft] = useState<string | undefined>(
    instance.iconDataUrl,
  );
  const [widthDraft, setWidthDraft] = useState("");
  const [heightDraft, setHeightDraft] = useState("");
  const [xDraft, setXDraft] = useState("");
  const [yDraft, setYDraft] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pidCopied, setPidCopied] = useState(false);

  const handleCopyPid = async () => {
    try {
      await navigator.clipboard.writeText(String(instance.pid));
      setPidCopied(true);
      setTimeout(() => setPidCopied(false), PID_COPIED_RESET_MS);
    } catch {
      // ignore clipboard failures
    }
  };

  const handlePickIcon = async () => {
    const result = await window.api.pickIconFile();
    if (result) setIconDraft(result.dataUrl);
  };

  const handleEditToggle = async () => {
    setNameDraft(instance.windowTitle);
    setIconDraft(instance.iconDataUrl);

    if (!instance.isEditing) {
      const bounds = await window.api.getWindowBounds(instance.pid);
      setWidthDraft(bounds ? String(bounds.width) : "");
      setHeightDraft(bounds ? String(bounds.height) : "");
      setXDraft(bounds ? String(bounds.x) : "");
      setYDraft(bounds ? String(bounds.y) : "");
    }

    toggleEdit(instance.pid);
  };

  const handleSave = () => {
    const title = nameDraft.trim();
    if (
      title.length < MIN_APP_TITLE_LENGTH ||
      title.length > MAX_APP_TITLE_LENGTH
    )
      return;
    saveEdit(instance.pid, title, iconDraft);

    const bounds = parseWindowBoundsDraft(widthDraft, heightDraft, xDraft, yDraft);
    if (bounds) {
      window.api.setWindowBounds(instance.pid, bounds.x, bounds.y, bounds.width, bounds.height);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const raw = event.dataTransfer.getData(DRAG_MIME_TYPES.PRESET_ITEM);
    if (!raw) return;

    let preset: PresetItem;
    try {
      preset = JSON.parse(raw);
    } catch {
      return;
    }

    saveEdit(instance.pid, preset.title, preset.iconDataUrl);
    window.api.setWindowBounds(
      instance.pid,
      preset.x,
      preset.y,
      preset.width,
      preset.height,
    );
  };

  const handleInstanceDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(
      DRAG_MIME_TYPES.APP_INSTANCE,
      JSON.stringify({
        pid: instance.pid,
        title: instance.windowTitle || instance.displayName,
        iconDataUrl: instance.iconDataUrl,
      }),
    );
    suppressDefaultDragImage(event);
    setIsDragging(true);
  };

  const handleInstanceDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
    <div
      draggable
      onDragStart={handleInstanceDragStart}
      onDragEnd={handleInstanceDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`row-enter shrink-0 cursor-grab overflow-hidden rounded-lg border bg-white transition duration-150 active:cursor-grabbing dark:bg-green-900/30 ${
        isDragging ? "opacity-40" : ""
      } ${
        isDragOver
          ? "border-dashed border-green-500 ring-2 ring-green-300 dark:border-green-400 dark:ring-green-700"
          : "border-green-200 dark:border-green-800"
      }`}
    >
      <div className="flex items-center gap-10 px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 font-mono text-[9px] text-green-700 dark:text-green-300">
            PID {instance.pid}
            <IconButton
              icon={pidCopied ? Check : Copy}
              label="Copy PID"
              onClick={handleCopyPid}
              className="rounded p-0.5 text-green-500 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
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
              <img
                src={instance.iconDataUrl}
                alt=""
                className="h-7 w-7 rounded object-cover"
              />
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
            className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
          />

          <IconButton
            icon={instance.isVisible ? Eye : EyeOff}
            label={instance.isVisible ? "Minimize" : "Show"}
            onClick={() => toggleVisibility(instance.pid)}
            className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
          />

          <IconButton
            icon={Pencil}
            label="Edit"
            onClick={handleEditToggle}
            className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
          />
        </div>
      </div>

      {instance.isEditing && (
        <div className="flex flex-col gap-2 border-t border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/60">
          <div className="flex items-center gap-2">
            <IconPickerField
              iconDataUrl={iconDraft}
              onPick={handlePickIcon}
              ariaLabel="Update app icon"
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-green-400 text-green-600 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
            />

            <input
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSave()}
              placeholder="Update app name"
              maxLength={MAX_APP_TITLE_LENGTH}
              className="flex-1 rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
            />

            <IconButton
              icon={Check}
              label="Save"
              onClick={handleSave}
              className="rounded p-1.5 text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-800"
            />
            <IconButton
              icon={X}
              label="Cancel"
              onClick={() => toggleEdit(instance.pid)}
              className="rounded p-1.5 text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-800"
            />
          </div>

          <WindowBoundsFields
            width={widthDraft}
            height={heightDraft}
            x={xDraft}
            y={yDraft}
            onWidthChange={setWidthDraft}
            onHeightChange={setHeightDraft}
            onXChange={setXDraft}
            onYChange={setYDraft}
            onEnter={handleSave}
            gridClassName="grid grid-cols-4 gap-2 pl-10"
            inputClassName="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
          />
        </div>
      )}
    </div>

    <DragGhost active={isDragging}>
      <div className="flex max-w-60 items-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-2 shadow-xl dark:border-green-600 dark:bg-green-900">
        {instance.iconDataUrl ? (
          <img
            src={instance.iconDataUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-100 text-[10px] font-semibold text-green-700 dark:bg-green-800 dark:text-green-200">
            {initials(instance.windowTitle || instance.displayName)}
          </span>
        )}
        <span className="truncate text-xs font-medium text-green-950 dark:text-green-50">
          {instance.windowTitle || instance.displayName}
        </span>
      </div>
    </DragGhost>
    </>
  );
}
