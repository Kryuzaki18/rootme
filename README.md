<div align="center">

<img src="ui/public/rootme-logo.png" alt="RootMe logo" width="96" height="96" />

# RootMe

**An Electron + React app instance manager for Windows.**

[![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-593D88?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
[![Lucide](https://img.shields.io/badge/Lucide-F56565?style=for-the-badge&logo=lucide&logoColor=white)](https://lucide.dev/)
[![electron-builder](https://img.shields.io/badge/electron--builder-4A4A55?style=for-the-badge&logo=electron&logoColor=white)](https://www.electron.build/)

</div>

Search for running processes by name or window title, then manage each matching instance: toggle its visibility, focus it, move/resize its window, or rename its title and icon. Save any instance as a preset to reposition and relaunch its window layout later.

## Features

- **Verify** — search running processes by image name or window title (backed by `tasklist`), with recent searches remembered for quick re-lookup.
- **Focus** — restore and bring a window to the foreground.
- **Show/Minimize** — toggle a window's visibility, or send it to the tray.
- **Move/Resize** — read and update a window's position and size.
- **Edit** — rename a window's title and replace its icon live, via direct Win32 calls (`SetWindowText`, `WM_SETICON`).
- **Presets** — organize saved windows into named groups. Drag a search result into a group (or onto an existing preset to bind its PID) to capture its title, icon, and bounds; focus a single preset or a whole group at once; export/import groups as JSON.

Window edits (title, icon, position, size, visibility) apply only to the live running window for the current session and don't survive the target app restarting. Presets, recent searches, and the theme choice are saved locally in the app's storage and persist across restarts.

> Windows only. Window management relies on `tasklist` and Win32 APIs invoked through PowerShell.

## Tech stack

- [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/) for the desktop shell and build tooling
- [React 19](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/) for the renderer UI
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [lucide-react](https://lucide.dev/) for icons
- [electron-builder](https://www.electron.build/) for packaging

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script              | Description                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start the app in development mode         |
| `npm run build`       | Type-check and build the app for production |
| `npm run preview`     | Preview the production build              |
| `npm run build:win`   | Build and package a Windows installer/portable exe |
| `npm run build:dir`   | Build an unpacked Windows app directory (for testing) |
| `npm run typecheck`   | Type-check both the main and renderer processes |

## Project structure

```
src/
  main/            Electron main process (window management, process listing)
  preload/         Context bridge exposing the IPC API to the renderer
ui/
  src/
    components/    Shared UI components (icon button, drag ghost)
    features/
      commons/     App shell (header, theme toggle)
      home/        Search, results list, and presets panel
    store/         Zustand stores (app instances, presets)
    constants/     Storage keys and shared UI/drag constants
    types/         Renderer-side type declarations
```
