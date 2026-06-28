export type ImageProtocol =
  | 'kitty'
  | 'sixel'
  | 'halfblock'
  | 'braille'
  | 'ascii';

export type ImageSource = string | Uint8Array | Buffer;

export interface ImageData {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface RenderOptions {
  scale?: number;
  cols?: number;
  rows?: number;
  protocol?: ImageProtocol | 'auto';
  preserveAspectRatio?: boolean;
}

export const PROTOCOL_PRIORITY: ImageProtocol[] = [
  'kitty',
  'sixel',
  'halfblock',
];

export const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tiff',
  'tif',
  'ico',
  'avif',
  'pnm',
  'ppm',
  'pgm',
  'pbm',
  'hdr',
  'qoi',
  'exr',
]);
