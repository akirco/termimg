import { extname } from 'node:path';
import { Jimp } from 'jimp';
import type { ImageData, ImageSource } from './types.ts';
import { IMAGE_EXTENSIONS } from './types.ts';

export async function loadImage(source: ImageSource): Promise<ImageData> {
  const input =
    typeof source === 'string' ? source : Buffer.from(source as Uint8Array);
  const image = await Jimp.read(input);
  const { width, height, data } = image.bitmap;
  return { width, height, data: new Uint8Array(data) };
}

export async function resizeImage(
  image: ImageData,
  targetW: number,
  targetH: number,
): Promise<ImageData> {
  const img = Jimp.fromBitmap({
    width: image.width,
    height: image.height,
    data: image.data,
  });
  img.resize({ w: targetW, h: targetH });
  const { width, height, data } = img.bitmap;
  return { width, height, data: new Uint8Array(data) };
}

export function isImageExtension(path: string): boolean {
  const ext = extname(path).toLowerCase().replace('.', '');
  return IMAGE_EXTENSIONS.has(ext);
}
