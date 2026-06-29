const RAMP = ' .:-=+*#%@';

export class AsciiEncoder {
  encode(
    width: number,
    height: number,
    data: Uint8Array,
    x?: number,
    y?: number,
  ): string {
    if (width === 0 || height === 0 || data.length === 0) return '';

    const hasOffset = x !== undefined || y !== undefined;
    const lines: string[] = [];

    for (let row = 0; row < height; row++) {
      const parts: string[] = [];

      for (let col = 0; col < width; col++) {
        const idx = (row * width + col) * 4;
        const r = data[idx]!;
        const g = data[idx + 1]!;
        const b = data[idx + 2]!;

        const luminance = (r * 77 + g * 150 + b * 29) >> 8;
        const rampIdx = Math.floor((luminance * (RAMP.length - 1)) / 255);
        const ch = RAMP[rampIdx]!;

        const fg = luminance > 140 ? '30' : '37';
        parts.push(`\x1b[48;2;${r};${g};${b}m\x1b[${fg}m${ch}`);
      }

      parts.push('\x1b[0m');
      if (hasOffset) {
        const displayRow = y !== undefined ? y + row + 1 : row + 1;
        const displayCol = x !== undefined ? x + 1 : 1;
        lines.push(`\x1b[${displayRow};${displayCol}H${parts.join('')}`);
      } else {
        lines.push(parts.join(''));
      }
    }

    return hasOffset ? lines.join('') : lines.join('\r\n');
  }
}
