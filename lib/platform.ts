// Platform detection utilities

export function isMac(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

export function isWindows(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('WIN') >= 0
}

export function isLinux(): boolean {
  if (typeof window === 'undefined') return false
  return navigator.platform.toUpperCase().indexOf('LINUX') >= 0
}

export function getKeyboardShortcutText(): string {
  if (isMac()) {
    return '(⌘+Enter)'
  } else {
    return '(Ctrl+Enter)'
  }
}

export function getKeyboardShortcutKey(): string {
  if (isMac()) {
    return '⌘'
  } else {
    return 'Ctrl'
  }
}
