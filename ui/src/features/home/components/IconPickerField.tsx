import { ImagePlus } from "lucide-react";

interface IconPickerFieldProps {
  iconDataUrl: string | undefined;
  onPick: () => void;
  ariaLabel: string;
  className: string;
}

export default function IconPickerField({
  iconDataUrl,
  onPick,
  ariaLabel,
  className,
}: IconPickerFieldProps) {
  return (
    <button type="button" onClick={onPick} className={className} aria-label={ariaLabel}>
      {iconDataUrl ? (
        <img src={iconDataUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImagePlus className="h-4 w-4" />
      )}
    </button>
  );
}
