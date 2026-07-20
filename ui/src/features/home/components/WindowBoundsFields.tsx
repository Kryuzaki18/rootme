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
  const fields = [
    { label: "Width", value: width, onChange: onWidthChange },
    { label: "Height", value: height, onChange: onHeightChange },
    { label: "X", value: x, onChange: onXChange },
    { label: "Y", value: y, onChange: onYChange },
  ];

  return (
    <div className={gridClassName}>
      {fields.map((field) => (
        <label
          key={field.label}
          className="flex flex-col gap-1 text-xs text-green-700 dark:text-green-400"
        >
          {field.label}
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
