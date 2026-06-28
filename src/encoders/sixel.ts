import { image2sixel } from '../sixel.ts';

export class SixelEncoder {
  encode(width: number, height: number, data: Uint8Array): string {
    return image2sixel(data, width, height, 256);
  }
}
