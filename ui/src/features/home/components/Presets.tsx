import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Plus,
  Check,
  X,
  Trash2,
  Pencil,
  FolderPlus,
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  usePresetsStore,
  type PresetGroup,
  type PresetItem,
} from "../../../store/presetsStore";
import { useAppInstancesStore } from "../../../store/appInstancesStore";
import {
  downloadJson,
  initials,
  parseWindowBoundsDraft,
  suppressDefaultDragImage,
} from "../../../util";
import { DRAG_MIME_TYPES } from "../../../constants/drag.constant";
import {
  PRESET_EXPORT_FILENAME,
  PRESET_GROUP_EXPORT_FILENAME_PREFIX,
} from "../../../constants/preset.constant";
import {
  MAX_APP_TITLE_LENGTH,
  MIN_APP_TITLE_LENGTH,
} from "../../../constants/ui.constant";
import IconButton from "../../../components/IconButton";
import DragGhost from "../../../components/DragGhost";
import IconPickerField from "./IconPickerField";
import WindowBoundsFields from "./WindowBoundsFields";

const ICON_BUTTON_CLASS =
  "cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30";
const ICON_BUTTON_DISABLED_CLASS =
  "cursor-pointer rounded-full p-1.5 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-green-400 dark:hover:bg-green-900/30";

export default function Presets() {
  const {
    groups,
    addGroup,
    deleteGroup,
    renameGroup,
    addItem,
    updateItem,
    updateItemPid,
    deleteItem,
    importGroups,
  } = usePresetsStore();
  const { saveEdit } = useAppInstancesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    () => new Set(groups.map((group) => group.id)),
  );
  const [focusedPids, setFocusedPids] = useState<Set<number>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [iconDraft, setIconDraft] = useState<string | undefined>(undefined);
  const [pidDraft, setPidDraft] = useState("");
  const [widthDraft, setWidthDraft] = useState("");
  const [heightDraft, setHeightDraft] = useState("");
  const [xDraft, setXDraft] = useState("");
  const [yDraft, setYDraft] = useState("");

  const resetDraft = () => {
    setTitleDraft("");
    setIconDraft(undefined);
    setPidDraft("");
    setWidthDraft("");
    setHeightDraft("");
    setXDraft("");
    setYDraft("");
  };

  const handleItemFormToggle = (groupId: string) => {
    resetDraft();
    setEditingItemId(null);
    setOpenGroupId((current) => (current === groupId ? null : groupId));
    setCollapsedGroupIds((current) => {
      if (!current.has(groupId)) return current;
      const next = new Set(current);
      next.delete(groupId);
      return next;
    });
  };

  const handleEditStart = (groupId: string, item: PresetItem) => {
    setTitleDraft(item.title);
    setIconDraft(item.iconDataUrl);
    setPidDraft(item.pid !== undefined ? String(item.pid) : "");
    setWidthDraft(String(item.width));
    setHeightDraft(String(item.height));
    setXDraft(String(item.x));
    setYDraft(String(item.y));
    setEditingItemId(item.id);
    setOpenGroupId(groupId);
  };

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleRenameStart = (group: PresetGroup) => {
    setRenameDraft(group.title);
    setRenamingGroupId(group.id);
  };

  const handleRenameSave = (groupId: string) => {
    renameGroup(groupId, renameDraft.trim());
    setRenamingGroupId(null);
  };

  const handleRenameCancel = () => {
    setRenamingGroupId(null);
  };

  const handlePickIcon = async () => {
    const result = await window.api.pickIconFile();
    if (result) setIconDraft(result.dataUrl);
  };

  const handleDragStart = (
    event: DragEvent<HTMLDivElement>,
    item: PresetItem,
  ) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(DRAG_MIME_TYPES.PRESET_ITEM, JSON.stringify(item));
    suppressDefaultDragImage(event);
    setDraggingItemId(item.id);
  };

  const handleDragEnd = () => {
    setDraggingItemId(null);
  };

  const handleGroupDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME_TYPES.APP_INSTANCE))
      return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleGroupDragEnter = (
    event: DragEvent<HTMLDivElement>,
    groupId: string,
  ) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME_TYPES.APP_INSTANCE))
      return;
    event.preventDefault();
    setDragOverGroupId(groupId);
  };

  const handleGroupDragLeave = () => {
    setDragOverGroupId(null);
  };

  const isPidTakenInGroup = (
    groupId: string,
    pid: number,
    excludeItemId?: string,
  ) => {
    const group = groups.find((candidate) => candidate.id === groupId);
    if (!group) return false;
    return group.items.some(
      (item) => item.id !== excludeItemId && item.pid === pid,
    );
  };

  const handleGroupDrop = async (
    event: DragEvent<HTMLDivElement>,
    groupId: string,
  ) => {
    const raw = event.dataTransfer.getData(DRAG_MIME_TYPES.APP_INSTANCE);
    setDragOverGroupId(null);
    if (!raw) return;

    event.preventDefault();

    let instance: { pid: number; title: string; iconDataUrl?: string };
    try {
      instance = JSON.parse(raw);
    } catch {
      return;
    }

    const bounds = await window.api.getWindowBounds(instance.pid);
    addItem(groupId, {
      title: instance.title,
      iconDataUrl: instance.iconDataUrl,
      width: bounds?.width ?? 0,
      height: bounds?.height ?? 0,
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0,
      pid: isPidTakenInGroup(groupId, instance.pid) ? undefined : instance.pid,
    });
  };

  const handleItemDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME_TYPES.APP_INSTANCE))
      return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleItemDragEnter = (
    event: DragEvent<HTMLDivElement>,
    itemId: string,
  ) => {
    if (!event.dataTransfer.types.includes(DRAG_MIME_TYPES.APP_INSTANCE))
      return;
    event.preventDefault();
    event.stopPropagation();
    setDragOverItemId(itemId);
  };

  const handleItemDragLeave = () => {
    setDragOverItemId(null);
  };

  const handleItemDrop = (
    event: DragEvent<HTMLDivElement>,
    groupId: string,
    item: PresetItem,
  ) => {
    const raw = event.dataTransfer.getData(DRAG_MIME_TYPES.APP_INSTANCE);
    setDragOverItemId(null);
    setDragOverGroupId(null);
    if (!raw) return;

    event.preventDefault();
    event.stopPropagation();

    let instance: { pid: number };
    try {
      instance = JSON.parse(raw);
    } catch {
      return;
    }

    if (isPidTakenInGroup(groupId, instance.pid, item.id)) return;

    updateItemPid(groupId, item.id, instance.pid);
    saveEdit(instance.pid, item.title, item.iconDataUrl);
    window.api.setWindowBounds(instance.pid, item.x, item.y, item.width, item.height);
  };

  const setPidsFocused = (pids: number[], focused: boolean) => {
    setFocusedPids((current) => {
      const next = new Set(current);
      for (const pid of pids) {
        if (focused) {
          next.add(pid);
        } else {
          next.delete(pid);
        }
      }
      return next;
    });
  };

  const focusItemAtPosition = (item: PresetItem & { pid: number }) =>
    Promise.all([
      window.api.focusWindow(item.pid),
      window.api.setWindowBounds(
        item.pid,
        item.x,
        item.y,
        item.width,
        item.height,
      ),
      item.iconDataUrl
        ? window.api.setWindowIcon(item.pid, item.iconDataUrl)
        : Promise.resolve(true),
    ]).then(([focused]) => focused);

  const handleItemFocusToggle = (item: PresetItem) => {
    if (item.pid === undefined) return;

    const pid = item.pid;
    const nextFocused = !focusedPids.has(pid);

    setPidsFocused([pid], nextFocused);

    const request = nextFocused
      ? focusItemAtPosition(item as PresetItem & { pid: number })
      : window.api.hideWindowToTray(pid);
    request.then((success) => {
      if (!success) setPidsFocused([pid], !nextFocused);
    });
  };

  const handleGroupFocusToggle = (group: PresetGroup) => {
    const items = group.items.filter(
      (item): item is PresetItem & { pid: number } => item.pid !== undefined,
    );
    if (items.length === 0) return;

    const isGroupFocused = items.every((item) => focusedPids.has(item.pid));
    const nextFocused = !isGroupFocused;
    const pids = items.map((item) => item.pid);

    setPidsFocused(pids, nextFocused);

    Promise.all(
      items.map((item) =>
        nextFocused
          ? focusItemAtPosition(item)
          : window.api.hideWindowToTray(item.pid),
      ),
    ).then((results) => {
      const failedPids = pids.filter((_, index) => !results[index]);
      if (failedPids.length > 0) setPidsFocused(failedPids, !nextFocused);
    });
  };

  const handleExportAll = () => {
    if (groups.length === 0) return;
    downloadJson(PRESET_EXPORT_FILENAME, groups);
  };

  const handleExportGroup = (group: PresetGroup) => {
    if (group.items.length === 0) return;
    downloadJson(`${PRESET_GROUP_EXPORT_FILENAME_PREFIX}${group.id}.json`, [
      group,
    ]);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      importGroups(JSON.parse(text));
    } catch {
      // ignore invalid file
    }
  };

  const renderPresetForm = (groupId: string, wrapperClassName: string) => {
    const trimmedTitle = titleDraft.trim();
    const isInvalidTitleLength =
      trimmedTitle.length < MIN_APP_TITLE_LENGTH ||
      trimmedTitle.length > MAX_APP_TITLE_LENGTH;
    const trimmedPid = pidDraft.trim();
    const parsedPid = trimmedPid ? Number(trimmedPid) : undefined;
    const isInvalidPid = parsedPid !== undefined && !Number.isFinite(parsedPid);
    const isDuplicatePid =
      parsedPid !== undefined &&
      Number.isFinite(parsedPid) &&
      isPidTakenInGroup(groupId, parsedPid, editingItemId ?? undefined);

    return (
      <div
        className={`flex flex-col gap-2 px-3 py-2.5 dark:bg-green-950/20 ${wrapperClassName}`}
      >
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
              onKeyDown={(event) => event.key === "Enter" && handleSave(groupId)}
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
              onKeyDown={(event) =>
                event.key === "Enter" && handleSave(groupId)
              }
              placeholder="Process ID"
              className={`w-full rounded border bg-white px-2 py-1 pr-7 text-sm text-green-950 focus:outline-none focus:ring-2 dark:bg-green-900/20 dark:text-green-50 ${
                isDuplicatePid || isInvalidPid
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-600 dark:focus:ring-red-900"
                  : "border-green-300 focus:border-green-500 focus:ring-green-100 dark:border-green-700 dark:focus:ring-green-800"
              }`}
            />
            <IconButton
              icon={X}
              label="Clear PID"
              onClick={() => setPidDraft("")}
              disabled={!pidDraft}
              className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 text-green-500 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              iconClassName="h-3.5 w-3.5"
            />
          </div>
          {isDuplicatePid && (
            <span className="text-red-500 dark:text-red-400">
              This PID is already used in this group.
            </span>
          )}
        </label>

        <WindowBoundsFields
          width={widthDraft}
          height={heightDraft}
          x={xDraft}
          y={yDraft}
          onWidthChange={setWidthDraft}
          onHeightChange={setHeightDraft}
          onXChange={setXDraft}
          onYChange={setYDraft}
          onEnter={() => handleSave(groupId)}
          gridClassName="grid grid-cols-2 gap-2"
          inputClassName="rounded border border-green-300 bg-white px-2 py-1 text-sm text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
        />

        <button
          type="button"
          onClick={() => handleSave(groupId)}
          disabled={isInvalidTitleLength || isDuplicatePid || isInvalidPid}
          className="cursor-pointer flex items-center justify-center gap-2 rounded bg-green-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {editingItemId ? "Save changes" : "Save preset"}
        </button>
      </div>
    );
  };

  const handleSave = (groupId: string) => {
    const trimmedTitle = titleDraft.trim();
    if (
      trimmedTitle.length < MIN_APP_TITLE_LENGTH ||
      trimmedTitle.length > MAX_APP_TITLE_LENGTH
    )
      return;

    const trimmedPid = pidDraft.trim();
    const parsedPid = trimmedPid ? Number(trimmedPid) : undefined;
    if (parsedPid !== undefined && !Number.isFinite(parsedPid)) return;
    if (
      parsedPid !== undefined &&
      isPidTakenInGroup(groupId, parsedPid, editingItemId ?? undefined)
    )
      return;

    const bounds = parseWindowBoundsDraft(widthDraft, heightDraft, xDraft, yDraft);

    const values = {
      title: trimmedTitle,
      iconDataUrl: iconDraft,
      pid: parsedPid,
      width: bounds?.width ?? 0,
      height: bounds?.height ?? 0,
      x: bounds?.x ?? 0,
      y: bounds?.y ?? 0,
    };

    if (editingItemId) {
      updateItem(groupId, editingItemId, values);
    } else {
      addItem(groupId, values);
    }

    resetDraft();
    setEditingItemId(null);
    setOpenGroupId(null);
  };

  const draggingItem = groups
    .flatMap((group) => group.items)
    .find((item) => item.id === draggingItemId);

  return (
    <>
    <section className="flex h-full w-100 shrink-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold text-green-900 dark:text-green-100">
          Presets
        </h2>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept={DRAG_MIME_TYPES.PRESET_ITEM}
            className="hidden"
            onChange={handleImportChange}
          />
          <IconButton
            icon={Upload}
            label="Import presets"
            onClick={handleImportClick}
            className={ICON_BUTTON_CLASS}
          />
          <IconButton
            icon={Download}
            label="Export presets"
            onClick={handleExportAll}
            disabled={groups.length === 0}
            className={ICON_BUTTON_DISABLED_CLASS}
          />
          <IconButton
            icon={Plus}
            label="Add preset group"
            onClick={() => addGroup()}
            className={ICON_BUTTON_CLASS}
          />
        </div>
      </div>

      <div className="app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto pr-1">
        {groups.length === 0 && (
          <p className="rounded-lg border border-dashed border-green-300 px-4 py-6 text-center text-sm text-green-600 dark:border-green-800 dark:text-green-400">
            No preset groups yet.
          </p>
        )}

        {groups.map((group) => {
          const formOpen = openGroupId === group.id;

          const isDragOver = dragOverGroupId === group.id;
          const isCollapsed = collapsedGroupIds.has(group.id);
          const groupPids = group.items
            .map((item) => item.pid)
            .filter((pid): pid is number => pid !== undefined);
          const isGroupFocused =
            groupPids.length > 0 &&
            groupPids.every((pid) => focusedPids.has(pid));

          return (
            <div
              key={group.id}
              onDragOver={handleGroupDragOver}
              onDragEnter={(event) => handleGroupDragEnter(event, group.id)}
              onDragLeave={handleGroupDragLeave}
              onDrop={(event) => handleGroupDrop(event, group.id)}
              className={`flex shrink-0 flex-col gap-2 rounded-lg border p-3 transition dark:bg-green-950/10 ${
                isDragOver
                  ? "border-dashed border-green-500 ring-2 ring-green-300 dark:border-green-400 dark:ring-green-700"
                  : "border-green-200 dark:border-green-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {renamingGroupId === group.id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <input
                      type="text"
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleRenameSave(group.id);
                        if (event.key === "Escape") handleRenameCancel();
                      }}
                      placeholder="Group name"
                      autoFocus
                      className="flex-1 rounded border border-green-300 bg-white px-2 py-1 text-xs text-green-950 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-100 dark:focus:ring-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-50"
                    />
                    <IconButton
                      icon={Check}
                      label="Save group name"
                      onClick={() => handleRenameSave(group.id)}
                      className={ICON_BUTTON_CLASS}
                      iconClassName="h-3.5 w-3.5"
                    />
                    <IconButton
                      icon={X}
                      label="Cancel rename"
                      onClick={handleRenameCancel}
                      className={ICON_BUTTON_CLASS}
                      iconClassName="h-3.5 w-3.5"
                    />
                  </div>
                ) : (
                  <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400">
                    <IconButton
                      icon={isCollapsed ? ChevronRight : ChevronDown}
                      label={isCollapsed ? "Expand group" : "Collapse group"}
                      onClick={() => toggleGroupCollapse(group.id)}
                      className="shrink-0 rounded-full p-0.5 text-green-500 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                      iconClassName="h-3.5 w-3.5"
                    />
                    <FolderPlus className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {group.title || "Group"} ({group.items.length})
                    </span>
                    <IconButton
                      icon={Pencil}
                      label="Rename group"
                      onClick={() => handleRenameStart(group)}
                      className="shrink-0 rounded-full p-1 text-green-500 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                      iconClassName="h-3 w-3"
                    />
                  </span>
                )}

                {renamingGroupId !== group.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      icon={isGroupFocused ? Eye : EyeOff}
                      label={
                        isGroupFocused ? "Send group to tray" : "Focus group"
                      }
                      onClick={() => handleGroupFocusToggle(group)}
                      disabled={groupPids.length === 0}
                      className={ICON_BUTTON_DISABLED_CLASS}
                    />
                    <IconButton
                      icon={Download}
                      label="Export group"
                      onClick={() => handleExportGroup(group)}
                      disabled={group.items.length === 0}
                      className={ICON_BUTTON_DISABLED_CLASS}
                    />
                    <IconButton
                      icon={formOpen ? X : Plus}
                      label={formOpen ? "Cancel" : "Add preset item"}
                      onClick={() => handleItemFormToggle(group.id)}
                      className={ICON_BUTTON_CLASS}
                    />
                    <IconButton
                      icon={Trash2}
                      label="Delete group"
                      onClick={() => deleteGroup(group.id)}
                      className={ICON_BUTTON_CLASS}
                    />
                  </div>
                )}
              </div>

              {!isCollapsed &&
                formOpen &&
                !editingItemId &&
                renderPresetForm(
                  group.id,
                  "rounded-lg border border-green-200 dark:border-green-800",
                )}

              {!isCollapsed && group.items.length === 0 && !formOpen && (
                <p className="rounded-lg border border-dashed border-green-300 px-4 py-4 text-center text-xs text-green-600 dark:border-green-800 dark:text-green-400">
                  No presets in this group yet.
                </p>
              )}

              {!isCollapsed &&
                group.items.map((item) => {
                  const isEditingThisItem =
                    formOpen && editingItemId === item.id;
                  const isItemFocused =
                    item.pid !== undefined && focusedPids.has(item.pid);
                  const isItemDragOver = dragOverItemId === item.id;
                  const isItemDragging = draggingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      onDragOver={handleItemDragOver}
                      onDragEnter={(event) =>
                        handleItemDragEnter(event, item.id)
                      }
                      onDragLeave={handleItemDragLeave}
                      onDrop={(event) => handleItemDrop(event, group.id, item)}
                      className={`flex shrink-0 flex-col overflow-hidden rounded-lg border bg-white transition duration-150 dark:bg-green-900/30 ${
                        isItemDragging ? "opacity-40" : ""
                      } ${
                        isItemDragOver
                          ? "border-dashed border-green-500 ring-2 ring-green-300 dark:border-green-400 dark:ring-green-700"
                          : "border-green-200 dark:border-green-800"
                      }`}
                    >
                      <div
                        draggable
                        onDragStart={(event) => handleDragStart(event, item)}
                        onDragEnd={handleDragEnd}
                        className="flex cursor-grab items-center gap-1 p-2 active:cursor-grabbing"
                      >
                        {item.iconDataUrl ? (
                          <img
                            src={item.iconDataUrl}
                            alt=""
                            className="h-7 w-7 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-800 dark:text-green-200">
                            {initials(item.title)}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-green-950 dark:text-green-50">
                            {item.title}
                          </p>
                          <p className="truncate text-[10px] text-green-600 dark:text-green-400">
                            {item.pid !== undefined && `PID ${item.pid} - `}
                            {item.width}×{item.height} at ({item.x}, {item.y})
                          </p>
                        </div>

                        <IconButton
                          icon={isItemFocused ? Eye : EyeOff}
                          label={isItemFocused ? "Send to tray" : "Focus"}
                          onClick={() => handleItemFocusToggle(item)}
                          disabled={item.pid === undefined}
                          className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-green-400 dark:hover:bg-green-800"
                        />
                        <IconButton
                          icon={isEditingThisItem ? X : Pencil}
                          label={
                            isEditingThisItem ? "Cancel edit" : "Edit preset"
                          }
                          onClick={() =>
                            isEditingThisItem
                              ? handleItemFormToggle(group.id)
                              : handleEditStart(group.id, item)
                          }
                          className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete preset"
                          onClick={() => deleteItem(group.id, item.id)}
                          className="shrink-0 rounded-full p-1.5 text-green-600 transition hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800"
                        />
                      </div>

                      {isEditingThisItem &&
                        renderPresetForm(
                          group.id,
                          "border-t border-green-200 dark:border-green-800",
                        )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </section>

    <DragGhost active={draggingItem !== undefined}>
      <div className="flex max-w-60 items-center gap-2 rounded-lg border border-green-300 bg-white px-3 py-2 shadow-xl dark:border-green-600 dark:bg-green-900">
        {draggingItem?.iconDataUrl ? (
          <img
            src={draggingItem.iconDataUrl}
            alt=""
            className="h-6 w-6 shrink-0 rounded object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-green-100 text-[10px] font-semibold text-green-700 dark:bg-green-800 dark:text-green-200">
            {initials(draggingItem?.title ?? "")}
          </span>
        )}
        <span className="truncate text-xs font-medium text-green-950 dark:text-green-50">
          {draggingItem?.title}
        </span>
      </div>
    </DragGhost>
    </>
  );
}
