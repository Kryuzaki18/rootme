import { useState, type DragEvent } from "react";
import { Eye, EyeOff, Focus, Pencil, ImagePlus, Check, X, Copy } from "lucide-react";
import {
  useAppInstancesStore,
  type AppInstance,
} from "../../../store/appInstancesStore";
import type { PresetItem } from "../../../store/presetsStore";
import { DRAG_MIME_TYPES } from "../../../constants/drag.constant";
import { PID_COPIED_RESET_MS } from "../../../constants/ui.constant";

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
    if (!nameDraft.trim()) return;
    const title = nameDraft.trim();
    saveEdit(instance.pid, title, iconDraft);

    const width = Number(widthDraft);
    const height = Number(heightDraft);
    const x = Number(xDraft);
    const y = Number(yDraft);
    const hasValidBounds = [width, height, x, y].every((value) =>
      Number.isFinite(value),
    );
    if (hasValidBounds) {
      window.api.setWindowBounds(instance.pid, x, y, width, height);
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
  };

  return (
    <div
      draggable
      onDragStart={handleInstanceDragStart}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`row-enter shrink-0 cursor-grab overflow-hidden rounded-lg border bg-white transition active:cursor-grabbing dark:bg-green-900/30 ${
        isDragOver
          ? "border-green-500 ring-2 ring-green-300 dark:border-green-400 dark:ring-green-700"
          : "border-green-200 dark:border-green-800"
      }`}
    >
      <div className="flex items-center gap-10 px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 font-mono text-[9px] text-green-700 dark:text-green-300">
            PID {instance.pid}
            <button
              type="button"
              onClick={handleCopyPid}
              className="cursor-pointer rounded p-0.5 text-green-500 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
              aria-label="Copy PID"
            >
              {pidCopied ? (
                <Check className="h-2.5 w-2.5" />
              ) : (
                <Copy className="h-2.5 w-2.5" />
              )}
            </button>
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
            <span className="font-normal">
              {instance.windowTitle} | {instance.imageName}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => focusInstance(instance.pid)}
            className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
            aria-label="Show and focus"
          >
            <Focus className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleVisibility(instance.pid)}
            className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
            aria-label={instance.isVisible ? "Minimize" : "Show"}
          >
            {instance.isVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleEditToggle}
            className="rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {instance.isEditing && (
        <div className="flex flex-col gap-2 border-t border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePickIcon}
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-dashed border-green-400 text-green-600 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
              aria-label="Update app icon"
            >
              {iconDraft ? (
                <img
                  src={iconDraft}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </button>

            <input
              type="text"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleSave()}
              placeholder="Update app name"
              className="flex-1 rounded border border-green-300 bg-white px-3 py-1.5 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
            />

            <button
              type="button"
              onClick={handleSave}
              className="rounded p-1.5 text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-800"
              aria-label="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleEdit(instance.pid)}
              className="rounded p-1.5 text-green-700 hover:bg-green-200 dark:text-green-300 dark:hover:bg-green-800"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pl-10">
            <label className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400">
              Width
              <input
                type="number"
                value={widthDraft}
                onChange={(event) => setWidthDraft(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
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
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
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
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
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
                onKeyDown={(event) => event.key === "Enter" && handleSave()}
                placeholder="Y"
                className="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 dark:border-green-700 dark:bg-green-900/40 dark:text-green-50"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
