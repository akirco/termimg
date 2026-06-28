import type { ImageProtocol } from './types.ts';
import { PROTOCOL_PRIORITY } from './types.ts';

export function detectProtocol(force?: ImageProtocol | 'auto'): ImageProtocol {
  if (force && force !== 'auto') {
    return force;
  }

  for (const proto of PROTOCOL_PRIORITY) {
    if (checkSupport(proto)) {
      return proto;
    }
  }

  return 'halfblock';
}

function checkSupport(proto: ImageProtocol): boolean {
  switch (proto) {
    case 'kitty':
      return supportsKitty();
    case 'sixel':
      return supportsSixel();
    default:
      return false;
  }
}

function supportsKitty(): boolean {
  const env = process.env;

  if (env.KITTY_WINDOW_ID || env.KITTY_PID) return true;
  if (env.GHOSTTY_RESOURCES_DIR) return true;

  const tp = (env.TERM_PROGRAM ?? '').toLowerCase();
  if (['kitty', 'ghostty', 'rio', 'warpterminal'].includes(tp)) return true;
  if (tp === 'wezterm') return true;
  if (tp === 'iterm.app') {
    const v = parseVersion(env.TERM_PROGRAM_VERSION);
    return v !== null && v >= 3_060_000;
  }
  if (tp === 'konsole' || env.KONSOLE_VERSION) {
    return getKonsoleVersion(env) >= 220_400;
  }

  if (/kitty/i.test(env.TERM ?? '')) return true;
  if (env.TERM === 'xterm-ghostty') return true;
  if (env.LC_TERMINAL === 'wezterm') return true;

  return false;
}

function supportsSixel(): boolean {
  const env = process.env;

  if (env.FOOT_VERSION) return true;
  if (/^foot/i.test(env.TERM ?? '')) return true;

  const tp = (env.TERM_PROGRAM ?? '').toLowerCase();

  if (tp === 'vscode') {
    const v = parseVersion(env.TERM_PROGRAM_VERSION);
    return v !== null && v >= 1_080_000;
  }
  if (tp === 'rio') {
    const v = parseVersion(env.TERM_PROGRAM_VERSION);
    return v !== null && v >= 12_000;
  }
  if (tp === 'wezterm') {
    return wezTermVersionSatisfies(env);
  }
  if (tp === 'mintty') return true;
  if (tp === 'konsole' || env.KONSOLE_VERSION) {
    return getKonsoleVersion(env) >= 220_400;
  }
  if (/^mlterm/i.test(env.TERM ?? '')) return true;

  return false;
}

function isWezTermTerminal(env: NodeJS.ProcessEnv): boolean {
  return !!(
    env.WEZTERM_PANE ||
    env.WEZTERM_UNIX_SOCKET ||
    (env.TERM_PROGRAM ?? '').toLowerCase() === 'wezterm' ||
    env.LC_TERMINAL === 'wezterm'
  );
}

function wezTermVersionSatisfies(env: NodeJS.ProcessEnv): boolean {
  if (!isWezTermTerminal(env)) return false;
  const v = env.TERM_PROGRAM_VERSION;
  if (!v) return true;
  const [ma, mi, pa] = v.replace(/^v/i, '').split('.').map(Number);
  if (ma === undefined || mi === undefined || pa === undefined) return false;
  const n = ma * 10_000_000 + mi * 10_000 + pa;
  return n >= 20_200_620;
}

function getKonsoleVersion(env: NodeJS.ProcessEnv): number {
  const raw = env.KONSOLE_VERSION;
  if (raw) {
    const n = Number(raw);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function parseVersion(raw?: string): number | null {
  if (!raw) return null;
  const [ma, mi, pa] = raw.replace(/^v/i, '').split('.').map(Number);
  if (ma === undefined || Number.isNaN(ma)) return null;
  return ma * 1_000_000 + (mi ?? 0) * 1_000 + (pa ?? 0);
}
