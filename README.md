# RootMe

App instance manager for Windows, built with Electron, React, and TypeScript.

Search for running processes by name or window title, then manage each matching instance: toggle its visibility, bring it to focus, or rename its window title and icon.

## Features

- **Verify** — search running processes by image name or window title (backed by `tasklist`).
- **Focus** — restore and bring a window to the foreground.
- **Show/Minimize** — toggle a window's visibility.
- **Edit** — rename a window's title and replace its icon live, via direct Win32 calls (`SetWindowText`, `WM_SETICON`).

All edits apply only to the live running window for the current session — nothing is persisted to disk, and changes don't survive the target app restarting.

> Windows only. Window management relies on `tasklist` and Win32 APIs invoked through PowerShell.

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/)
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Zustand](https://github.com/pmndrs/zustand) for state
- [Tailwind CSS](https://tailwindcss.com/)
- [lucide-react](https://lucide.dev/) for icons

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the app in development mode     |
| `npm run build`   | Build the app for production          |
| `npm run preview` | Preview the production build          |

## Project structure

```
src/
  main/            Electron main process (window management, process listing)
  preload/         Context bridge exposing the IPC API to the renderer
ui/
  src/
    features/      UI feature components (home, header)
    store/         Zustand stores
    types/         Renderer-side type declarations
```
