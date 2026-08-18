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
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/80 px-6 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex items-center gap-3">
        <img
          src="./rootme-logo.png"
          alt={APP_NAME}
          className="h-9 w-9 rounded-lg object-contain transition-transform duration-200 hover:scale-105"
        />
        <div>
          <h1 className="text-lg font-semibold leading-tight text-zinc-900 dark:text-zinc-50">
            {APP_NAME}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-all duration-150 hover:bg-red-50 hover:text-red-600 active:scale-90 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          iconClassName="h-5 w-5"
        />
        <IconButton
          icon={Power}
          label="Force Close"
          onClick={() => setIsForceCloseOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition-all duration-150 hover:bg-red-50 active:scale-90 dark:text-red-400 dark:hover:bg-red-950/40"
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
