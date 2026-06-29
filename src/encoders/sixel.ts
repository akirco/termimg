import { image2sixel } from "../sixel.ts";

export class SixelEncoder {
  encode(
    width: number,
    height: number,
    data: Uint8Array,
    x?: number,
    y?: number,
  ): string {
    const img = image2sixel(data, width, height, 256);
    if (x !== undefined || y !== undefined) {
      if (!img) return "";
      const offsetY = y !== undefined ? y + 1 : 1;
      const offsetX = x !== undefined ? x + 1 : 1;
      return `\x1b[${offsetY};${offsetX}H${img}`;
    }
    return img;
  }
}
