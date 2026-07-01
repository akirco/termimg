import { ensureCellSize } from './terminal.ts';
import type { ImageProtocol } from './types.ts';

export interface ClearOptions {
  cols: number;
  rows: number;
  x?: number;
  y?: number;
}

export async function clearImage(
  protocol: ImageProtocol,
  options: ClearOptions,
): Promise<string> {
  const { cols, rows, x, y } = options;

  if (protocol === 'kitty') {
    return '\x1b_Ga=d,i=1\x1b\\';
  }

  if (protocol === 'sixel') {
    const { cw, ch } = await ensureCellSize();
    const pixelW = cols * cw;
    const pixelH = rows * ch;

    // 空六色图，无调色版无像素数据，P2=1 透明背景 →
    // 终端会在这片区域创建一个全透明的六色图，覆盖并清除旧像素
    const img = `\x1bP0;1;q"1;1;${pixelW};${pixelH}\x1b\\`;

    const offsetY = y !== undefined ? y + 1 : 1;
    const offsetX = x !== undefined ? x + 1 : 1;
    return `\x1b[${offsetY};${offsetX}H${img}`;
  }

  return '';
}
