import { AsciiEncoder } from './encoders/ascii.ts';
import { BrailleEncoder } from './encoders/braille.ts';
import { HalfBlockEncoder } from './encoders/halfblock.ts';
import { KittyEncoder } from './encoders/kitty.ts';
import { SixelEncoder } from './encoders/sixel.ts';
import { loadImage, resizeImage } from './image.ts';
import { detectProtocol } from './protocol.ts';
import { ensureCellSize, fitDimensions } from './terminal.ts';
import type { ImageProtocol, ImageSource, RenderOptions } from './types.ts';

export interface RenderResult {
  stream: string;
  cols: number;
  rows: number;
}

function createEncoder(protocol: ImageProtocol) {
  switch (protocol) {
    case 'kitty':
      return new KittyEncoder();
    case 'sixel':
      return new SixelEncoder();
    case 'halfblock':
      return new HalfBlockEncoder();
    case 'braille':
      return new BrailleEncoder();
    case 'ascii':
      return new AsciiEncoder();
  }
}

export async function renderImage(
  source: ImageSource,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const protocol = detectProtocol(options.protocol);

  const image = await loadImage(source);

  await ensureCellSize();

  const { targetW, targetH } = fitDimensions(
    image.width,
    image.height,
    protocol,
    options,
  );

  const resized =
    targetW !== image.width || targetH !== image.height
      ? await resizeImage(image, targetW, targetH)
      : image;

  const encoder = createEncoder(protocol);
  const x = options.x ?? 0;
  const y = options.y ?? 0;

  return {
    stream: encoder.encode(targetW, targetH, resized.data, x, y),
    cols: targetW,
    rows: targetH,
  };
}
