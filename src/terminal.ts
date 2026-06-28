import type { ImageProtocol } from './types.ts';

const DEFAULT_CELL_W = 9;
const DEFAULT_CELL_H = 18;

let _cellSize: { cw: number; ch: number } | null = null;

export function terminalSize(): { cols: number; rows: number } {
  const cols = process.stdout.columns ?? 80;
  const rows = process.stdout.rows ?? 24;
  return { cols: Math.max(cols, 1), rows: Math.max(rows, 1) };
}

let _cellSizePromise: Promise<{ cw: number; ch: number }> | null = null;

function initCellSize(): void {
  if (!process.stdout.isTTY) {
    _cellSize = { cw: DEFAULT_CELL_W, ch: DEFAULT_CELL_H };
    return;
  }
  _cellSizePromise = queryCellSizeEscape().then((c) => {
    if (c) _cellSize = c;
    return cellSize();
  });
}

function cellSize(): { cw: number; ch: number } {
  return _cellSize ?? { cw: DEFAULT_CELL_W, ch: DEFAULT_CELL_H };
}

export async function ensureCellSize(): Promise<{ cw: number; ch: number }> {
  if (_cellSize) return _cellSize;
  if (_cellSizePromise) return _cellSizePromise;
  initCellSize();
  return _cellSizePromise!;
}

function queryCellSizeEscape(): Promise<{ cw: number; ch: number } | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 200);

    const stdin = process.stdin;

    function cleanup() {
      clearTimeout(timeout);
      try {
        stdin.setRawMode(false);
      } catch {}
      stdin.pause();
      stdin.removeListener('data', onData);
    }

    function onData(data: Buffer) {
      cleanup();
      const m = String(data).match(new RegExp('\\x1b\\[6;(\\d+);(\\d+)t'));
      if (m) {
        resolve({ cw: Number(m[2]), ch: Number(m[1]) });
      } else {
        resolve(null);
      }
    }

    try {
      stdin.setRawMode(true);
      stdin.resume();
      stdin.once('data', onData);
      process.stdout.write('\x1b[16t');
    } catch {
      cleanup();
      resolve(null);
    }
  });
}

export interface FitResult {
  targetW: number;
  targetH: number;
}

export function fitDimensions(
  origW: number,
  origH: number,
  protocol: ImageProtocol,
  options: {
    scale?: number;
    cols?: number;
    rows?: number;
    preserveAspectRatio?: boolean;
  } = {},
): FitResult {
  const { cw, ch } = cellSize();
  const preserveAspectRatio = options.preserveAspectRatio ?? true;
  const { cols: termCols, rows: termRows } = terminalSize();

  let pxPerCol: number;
  let pxPerRow: number;
  switch (protocol) {
    case 'halfblock':
      pxPerCol = 1;
      pxPerRow = 2;
      break;
    case 'braille':
      pxPerCol = 2;
      pxPerRow = 4;
      break;
    case 'ascii':
      pxPerCol = 1;
      pxPerRow = 1;
      break;
    default:
      pxPerCol = cw;
      pxPerRow = ch;
  }

  let physBoundsW: number;
  let physBoundsH: number;

  if (options.cols && options.rows) {
    physBoundsW = options.cols * cw;
    physBoundsH = options.rows * ch;
  } else if (options.cols) {
    physBoundsW = options.cols * cw;
    physBoundsH = Math.max(termRows - 2, 1) * ch;
  } else if (options.rows) {
    physBoundsW = termCols * cw;
    physBoundsH = options.rows * ch;
  } else {
    const maxPhysW = termCols * cw;
    const maxPhysH = Math.max(termRows - 2, 1) * ch;
    const s = options.scale ?? 1;
    if (s < 1) {
      physBoundsW = Math.floor(maxPhysW * s);
      physBoundsH = Math.floor(maxPhysH * s);
    } else {
      physBoundsW = maxPhysW;
      physBoundsH = maxPhysH;
    }
  }

  physBoundsW = Math.max(physBoundsW, 1);
  physBoundsH = Math.max(physBoundsH, 1);

  if (preserveAspectRatio) {
    const fit = Math.min(physBoundsW / origW, physBoundsH / origH);
    const targetW = Math.floor((origW * fit * pxPerCol) / cw);
    const targetH = Math.floor((origH * fit * pxPerRow) / ch);
    return {
      targetW: Math.max(targetW, 1),
      targetH: Math.max(alignHeight(targetH, protocol), 1),
    };
  }

  const targetW = Math.floor((physBoundsW * pxPerCol) / cw);
  const targetH = Math.floor((physBoundsH * pxPerRow) / ch);
  return {
    targetW: Math.max(targetW, 1),
    targetH: Math.max(alignHeight(targetH, protocol), 1),
  };
}

function alignHeight(h: number, protocol: ImageProtocol): number {
  switch (protocol) {
    case 'halfblock':
      return Math.floor(h / 2) * 2;
    case 'braille':
      return Math.floor(h / 4) * 4;
    default:
      return h;
  }
}
