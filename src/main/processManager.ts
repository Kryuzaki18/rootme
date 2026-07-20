import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

const SW_MINIMIZE = 6
const SW_RESTORE = 9

export interface ProcessInstance {
  pid: number
  imageName: string
  windowTitle: string
  memUsage: string
}

function parseTasklistCsv(output: string): ProcessInstance[] {
  const lines = output.split(/\r?\n/).filter((line) => line.trim().length > 0)
  const instances: ProcessInstance[] = []

  for (const line of lines) {
    const fields = line.match(/"([^"]*)"/g)?.map((field) => field.slice(1, -1)) ?? []
    if (fields.length < 9) continue

    const [imageName, pidStr, , , memUsage, , , , windowTitle] = fields
    const pid = Number(pidStr)
    if (!Number.isFinite(pid)) continue

    instances.push({ pid, imageName, memUsage, windowTitle })
  }

  return instances
}

export async function verifyProcesses(title: string): Promise<ProcessInstance[]> {
  const search = title.trim().toLowerCase()
  if (!search) return []

  const { stdout } = await execFileAsync('tasklist', ['/v', '/fo', 'csv', '/nh'], {
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  })

  const all = parseTasklistCsv(stdout)

  return all.filter(
    (proc) =>
      proc.imageName.toLowerCase().includes(search) || proc.windowTitle.toLowerCase().includes(search)
  )
}

// Get-Process.MainWindowHandle uses a heuristic (first top-level window on the
// process's main thread) that misses many real windows on multi-process apps
// (e.g. game clients split across launcher/render/helper processes). Enumerating
// all top-level windows and matching by owning PID finds the real window instead.
const WIN32_TYPE_DEF = `
using System;
using System.Runtime.InteropServices;

public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
}

public static class RootMeWin32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern bool SetWindowText(IntPtr hWnd, string text);

    [DllImport("user32.dll")]
    public static extern bool ShowWindowAsync(IntPtr hWnd, int cmd);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);

    public static IntPtr FindMainWindow(uint pid) {
        IntPtr found = IntPtr.Zero;
        EnumWindows((hWnd, lParam) => {
            uint windowPid;
            GetWindowThreadProcessId(hWnd, out windowPid);
            if (windowPid == pid && IsWindowVisible(hWnd) && GetWindowTextLength(hWnd) > 0) {
                found = hWnd;
                return false;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
`.trim()

function buildScript(body: string): string {
  return [
    "Add-Type -TypeDefinition @'",
    WIN32_TYPE_DEF,
    "'@ -Language CSharp",
    '$targetPid = [uint32]$env:ROOTME_TARGET_PID',
    '$hwnd = [RootMeWin32]::FindMainWindow($targetPid)',
    body
  ].join('\n')
}

async function runWin32Script(
  pid: number,
  body: string,
  extraEnv: Record<string, string> = {}
): Promise<string> {
  const script = buildScript(body)
  const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
    windowsHide: true,
    env: { ...process.env, ROOTME_TARGET_PID: String(pid), ...extraEnv }
  })
  return stdout.trim()
}

export async function setWindowVisibility(pid: number, visible: boolean): Promise<boolean> {
  if (!Number.isInteger(pid)) return false

  const showCommand = visible ? SW_RESTORE : SW_MINIMIZE
  const body = [
    'if ($hwnd -ne [IntPtr]::Zero) {',
    `  [RootMeWin32]::ShowWindowAsync($hwnd, ${showCommand}) | Out-Null`,
    '  Write-Output "True"',
    '} else {',
    '  Write-Output "False"',
    '}'
  ].join('\n')

  const result = await runWin32Script(pid, body)
  return result.toLowerCase() === 'true'
}

export async function focusWindow(pid: number): Promise<boolean> {
  if (!Number.isInteger(pid)) return false

  const body = [
    'if ($hwnd -ne [IntPtr]::Zero) {',
    `  [RootMeWin32]::ShowWindowAsync($hwnd, ${SW_RESTORE}) | Out-Null`,
    '  $result = [RootMeWin32]::SetForegroundWindow($hwnd)',
    '  Write-Output $result',
    '} else {',
    '  Write-Output "False"',
    '}'
  ].join('\n')

  const result = await runWin32Script(pid, body)
  return result.toLowerCase() === 'true'
}

export async function setWindowTitle(pid: number, title: string): Promise<boolean> {
  if (!Number.isInteger(pid)) return false

  const body = [
    'if ($hwnd -ne [IntPtr]::Zero) {',
    '  $result = [RootMeWin32]::SetWindowText($hwnd, $env:ROOTME_TARGET_TITLE)',
    '  Write-Output $result',
    '} else {',
    '  Write-Output "False"',
    '}'
  ].join('\n')

  const result = await runWin32Script(pid, body, { ROOTME_TARGET_TITLE: title })
  return result.toLowerCase() === 'true'
}

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export async function getWindowBounds(pid: number): Promise<WindowBounds | null> {
  if (!Number.isInteger(pid)) return null

  const body = [
    'if ($hwnd -ne [IntPtr]::Zero) {',
    '  $rect = New-Object RECT',
    '  if ([RootMeWin32]::GetWindowRect($hwnd, [ref]$rect)) {',
    '    Write-Output "$($rect.Left),$($rect.Top),$($rect.Right - $rect.Left),$($rect.Bottom - $rect.Top)"',
    '  } else {',
    '    Write-Output "False"',
    '  }',
    '} else {',
    '  Write-Output "False"',
    '}'
  ].join('\n')

  const result = await runWin32Script(pid, body)
  if (result.toLowerCase() === 'false') return null

  const [x, y, width, height] = result.split(',').map(Number)
  if ([x, y, width, height].some((value) => !Number.isFinite(value))) return null

  return { x, y, width, height }
}

const SWP_NOZORDER = 0x0004
const SWP_NOACTIVATE = 0x0010

export async function setWindowBounds(
  pid: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<boolean> {
  if (!Number.isInteger(pid)) return false

  const body = [
    'if ($hwnd -ne [IntPtr]::Zero) {',
    `  $result = [RootMeWin32]::SetWindowPos($hwnd, [IntPtr]::Zero, [int]$env:ROOTME_X, [int]$env:ROOTME_Y, [int]$env:ROOTME_WIDTH, [int]$env:ROOTME_HEIGHT, ${SWP_NOZORDER | SWP_NOACTIVATE})`,
    '  Write-Output $result',
    '} else {',
    '  Write-Output "False"',
    '}'
  ].join('\n')

  const result = await runWin32Script(pid, body, {
    ROOTME_X: String(Math.round(x)),
    ROOTME_Y: String(Math.round(y)),
    ROOTME_WIDTH: String(Math.round(width)),
    ROOTME_HEIGHT: String(Math.round(height))
  })
  return result.toLowerCase() === 'true'
}

const WM_SETICON = 0x0080
const ICON_SMALL = 0
const ICON_BIG = 1

export async function setWindowIcon(pid: number, iconDataUrl: string): Promise<boolean> {
  if (!Number.isInteger(pid)) return false

  const match = iconDataUrl.match(/^data:[^;]+;base64,(.+)$/)
  if (!match) return false

  const tempPath = join(tmpdir(), `rootme-icon-${randomUUID()}`)
  await writeFile(tempPath, Buffer.from(match[1], 'base64'))

  try {
    const body = [
      'if ($hwnd -ne [IntPtr]::Zero) {',
      '  try {',
      "    Add-Type -AssemblyName System.Drawing",
      '    $bitmap = New-Object System.Drawing.Bitmap($env:ROOTME_ICON_PATH)',
      '    $hIcon = $bitmap.GetHicon()',
      `    [RootMeWin32]::SendMessage($hwnd, ${WM_SETICON}, [IntPtr]${ICON_SMALL}, $hIcon) | Out-Null`,
      `    [RootMeWin32]::SendMessage($hwnd, ${WM_SETICON}, [IntPtr]${ICON_BIG}, $hIcon) | Out-Null`,
      '    Write-Output "True"',
      '  } catch {',
      '    Write-Output "False"',
      '  }',
      '} else {',
      '  Write-Output "False"',
      '}'
    ].join('\n')

    const result = await runWin32Script(pid, body, { ROOTME_ICON_PATH: tempPath })
    return result.toLowerCase() === 'true'
  } finally {
    await unlink(tempPath).catch(() => {})
  }
}
