import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { STORAGE_KEYS } from "@/constants/storage.constant";
import { APP_NAME, APP_TAGLINE } from "@/constants/app.constant";
import IconButton from "@/components/IconButton";

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

      <IconButton
        icon={theme === "dark" ? Sun : Moon}
        label="Toggle theme"
        onClick={() =>
          setTheme((current) => (current === "dark" ? "light" : "dark"))
        }
        className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-full text-green-700 transition hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/30"
        iconClassName="h-5 w-5"
      />
    </header>
  );
}
