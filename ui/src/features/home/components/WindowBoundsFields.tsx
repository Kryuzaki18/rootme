import { useState } from "react";
import { Check, Copy } from "lucide-react";
import IconButton from "../../../components/IconButton";
import { PID_COPIED_RESET_MS } from "../../../constants/ui.constant";

interface WindowBoundsFieldsProps {
  width: string;
  height: string;
  x: string;
  y: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  onXChange: (value: string) => void;
  onYChange: (value: string) => void;
  onEnter: () => void;
  gridClassName: string;
  inputClassName: string;
}

export default function WindowBoundsFields({
  width,
  height,
  x,
  y,
  onWidthChange,
  onHeightChange,
  onXChange,
  onYChange,
  onEnter,
  gridClassName,
  inputClassName,
}: WindowBoundsFieldsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (label: string, value: string) => {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(
        () =>
          setCopiedField((current) => (current === label ? null : current)),
        PID_COPIED_RESET_MS,
      );
    } catch {
      // ignore clipboard failures
    }
  };

  const fields = [
    { label: "Width", value: width, onChange: onWidthChange, copyable: true },
    {
      label: "Height",
      value: height,
      onChange: onHeightChange,
      copyable: true,
    },
    { label: "X", value: x, onChange: onXChange, copyable: false },
    { label: "Y", value: y, onChange: onYChange, copyable: false },
  ];

  return (
    <div className={gridClassName}>
      {fields.map((field) => (
        <label
          key={field.label}
          className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400"
        >
          <span className="flex items-center justify-between gap-1">
            {field.label}
            {field.copyable && (
              <IconButton
                icon={copiedField === field.label ? Check : Copy}
                label={`Copy ${field.label}`}
                onClick={() => handleCopy(field.label, field.value)}
                disabled={!field.value.trim()}
                className="rounded p-0.5 text-green-500 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent dark:text-green-400 dark:hover:bg-green-800"
                iconClassName="h-2.5 w-2.5"
              />
            )}
          </span>
          <input
            type="number"
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onEnter()}
            placeholder={field.label}
            className={inputClassName}
          />
        </label>
      ))}
    </div>
  );
}
