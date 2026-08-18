import { useEffect, useState } from "react";
import { Moon, Power, Sun } from "lucide-react";
import { STORAGE_KEYS } from "@/constants/storage.constant";
import { APP_NAME, APP_TAGLINE } from "@/constants/app.constant";
import IconButton from "@/components/IconButton";
import ConfirmDialog from "@/components/ConfirmDialog";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEYS.THEME);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Header() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isForceCloseOpen, setIsForceCloseOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-green-200 bg-green-50/30 px-6 py-4 backdrop-blur dark:border-green-900 dark:bg-gray-950/90">
      <div className="flex items-center gap-3">
        <img
          src="./rootme-logo.png"
          alt={APP_NAME}
          className="h-9 w-9 rounded-lg object-contain"
        />
        <div>
          <h1 className="text-lg font-semibold leading-tight text-green-900 dark:text-green-50">
            {APP_NAME}
          </h1>
          <p className="text-xs text-green-700 dark:text-green-400">
            {APP_TAGLINE}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          icon={theme === "dark" ? Sun : Moon}
          label="Toggle theme"
          onClick={() =>
            setTheme((current) => (current === "dark" ? "light" : "dark"))
          }
          className="flex h-9 w-9 items-center justify-center rounded-full text-green-700 transition hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/30"
          iconClassName="h-5 w-5"
        />
        <IconButton
          icon={Power}
          label="Force Close"
          onClick={() => setIsForceCloseOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          iconClassName="h-5 w-5"
        />
      </div>

      <ConfirmDialog
        open={isForceCloseOpen}
        title="Force close RootMe?"
        description="This fully quits the app instead of minimizing it to the tray. Any running instances managed by RootMe will keep running."
        confirmLabel="Force Close"
        icon={<Power className="h-5 w-5" />}
        onConfirm={() => window.api.forceQuit()}
        onCancel={() => setIsForceCloseOpen(false)}
      />
    </header>
  );
}
