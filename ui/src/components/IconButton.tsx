import type { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className: string;
  iconClassName?: string;
}

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  className,
  iconClassName = "h-4 w-4",
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      <Icon className={iconClassName} />
    </button>
  );
}
