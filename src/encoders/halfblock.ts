export class HalfBlockEncoder {
  encode(
    width: number,
    height: number,
    data: Uint8Array,
    x = 0,
    y = 0,
  ): string {
    if (width === 0 || height === 0 || data.length === 0) return '';

    const outputH = Math.ceil(height / 2);
    const lines: string[] = [];

    for (let row = 0; row < outputH; row++) {
      const parts: string[] = [];

      for (let col = 0; col < width; col++) {
        const topIdx = (row * 2 * width + col) * 4;
        const rT = data[topIdx]!;
        const gT = data[topIdx + 1]!;
        const bT = data[topIdx + 2]!;

        const botRow = row * 2 + 1;
        if (botRow < height) {
          const botIdx = (botRow * width + col) * 4;
          const rB = data[botIdx]!;
          const gB = data[botIdx + 1]!;
          const bB = data[botIdx + 2]!;
          parts.push(
            `\x1b[38;2;${rT};${gT};${bT}m\x1b[48;2;${rB};${gB};${bB}m\u2580`,
          );
        } else {
          parts.push(`\x1b[38;2;${rT};${gT};${bT}m\u2580`);
        }
      }

      parts.push('\x1b[0m');
      const shiftedCol = x + 1;
      const shiftedRow = y + row + 1;
      lines.push(`\x1b[${shiftedRow};${shiftedCol}H${parts.join('')}`);
    }

    return lines.join('');
  }
}
