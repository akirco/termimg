export class KittyEncoder {
  private frameId = 0;

  encode(
    width: number,
    height: number,
    data: Uint8Array,
    x?: number,
    y?: number,
  ): string {
    if (width === 0 || height === 0 || data.length === 0) return '';

    this.frameId++;
    const frameId = this.frameId;

    const n = width * height;
    const rgb = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) {
      const si = i * 4;
      const di = i * 3;
      rgb[di] = data[si]!;
      rgb[di + 1] = data[si + 1]!;
      rgb[di + 2] = data[si + 2]!;
    }

    const parts: string[] = [];
    const hasOffset = x !== undefined || y !== undefined;
    if (hasOffset) {
      const displayRow = y !== undefined ? y + 1 : 1;
      const displayCol = x !== undefined ? x + 1 : 1;
      parts.push(`\x1b[${displayRow};${displayCol}H`);
    }

    const b64 = Buffer.from(rgb).toString('base64');
    const chunkSize = 16384;
    const totalChunks = Math.ceil(b64.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = b64.slice(i * chunkSize, (i + 1) * chunkSize);
      const isLast = i === totalChunks - 1;
      const m = isLast ? 0 : 1;

      if (i === 0) {
        parts.push(
          `\x1b_Ga=T,f=24,s=${width},v=${height},i=${frameId},p=1,q=1,m=${m};${chunk}\x1b\\`,
        );
      } else {
        parts.push(`\x1b_Gm=${m};${chunk}\x1b\\`);
      }
    }

    if (!hasOffset) {
      parts.push('\r\n');
    }

    return parts.join('');
  }
}
