import { image2sixel } from '../sixel.ts';

export class SixelEncoder {
  encode(
    width: number,
    height: number,
    data: Uint8Array,
    x = 0,
    y = 0,
  ): string {
    const img = image2sixel(data, width, height, 256);
    if (!img) return '';
    return `\x1b[${y + 1};${x + 1}H${img}`;
  }
}
