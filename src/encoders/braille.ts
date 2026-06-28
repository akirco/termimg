export class BrailleEncoder {
  encode(width: number, height: number, data: Uint8Array): string {
    if (width === 0 || height === 0 || data.length === 0) return '';

    const lines: string[] = [];

    for (let row = 0; row < height; row += 4) {
      const parts: string[] = [];

      for (let col = 0; col < width; col += 2) {
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;

        for (let dy = 0; dy < 4; dy++) {
          const py = row + dy;
          if (py >= height) continue;
          for (let dx = 0; dx < 2; dx++) {
            const px = col + dx;
            if (px >= width) continue;
            const idx = (py * width + px) * 4;
            rSum += data[idx]!;
            gSum += data[idx + 1]!;
            bSum += data[idx + 2]!;
            count++;
          }
        }

        if (count > 0) {
          const r = Math.round(rSum / count);
          const g = Math.round(gSum / count);
          const b = Math.round(bSum / count);
          parts.push(`\x1b[38;2;${r};${g};${b}m\u28ff`);
        }
      }

      parts.push('\x1b[0m');
      lines.push(parts.join(''));
    }

    return lines.join('');
  }
}
