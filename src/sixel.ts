const INTRO = '\x1bP0;0;q';
const FINALIZER = '\x1b\\';

function codeToSixel(code: number, repeat: number): string {
  const c = String.fromCharCode(code + 63);
  if (repeat > 3) return '!' + repeat + c;
  if (repeat === 3) return c + c + c;
  if (repeat === 2) return c + c;
  return c;
}

function medianCut(
  pixels: Array<{ r: number; g: number; b: number }>,
  maxColors: number,
) {
  const n = pixels.length;

  function calcBounds(idxs: number[]) {
    let rMin = 255,
      rMax = 0,
      gMin = 255,
      gMax = 0,
      bMin = 255,
      bMax = 0;
    for (const idx of idxs) {
      const p = pixels[idx]!;
      if (p.r < rMin) rMin = p.r;
      if (p.r > rMax) rMax = p.r;
      if (p.g < gMin) gMin = p.g;
      if (p.g > gMax) gMax = p.g;
      if (p.b < bMin) bMin = p.b;
      if (p.b > bMax) bMax = p.b;
    }
    return { rMin, rMax, gMin, gMax, bMin, bMax };
  }

  interface Box {
    indices: number[];
    rMin: number;
    rMax: number;
    gMin: number;
    gMax: number;
    bMin: number;
    bMax: number;
  }

  function splitBox(b: Box): [Box, Box] | null {
    const dr = b.rMax - b.rMin;
    const dg = b.gMax - b.gMin;
    const db = b.bMax - b.bMin;
    let channel: 'r' | 'g' | 'b';
    if (dr >= dg && dr >= db) channel = 'r';
    else if (dg >= db) channel = 'g';
    else channel = 'b';

    b.indices.sort((a, b) => pixels[a]![channel] - pixels[b]![channel]);

    const mid = Math.floor(b.indices.length / 2);
    if (mid === 0 || mid === b.indices.length) return null;

    const leftIdxs = b.indices.slice(0, mid);
    const rightIdxs = b.indices.slice(mid);
    const leftBounds = calcBounds(leftIdxs);
    const rightBounds = calcBounds(rightIdxs);

    return [
      { indices: leftIdxs, ...leftBounds },
      { indices: rightIdxs, ...rightBounds },
    ];
  }

  const allIdxs = Array.from({ length: n }, (_, i) => i);
  const initialBounds = calcBounds(allIdxs);
  const boxes: Box[] = [{ indices: allIdxs, ...initialBounds }];

  while (boxes.length < maxColors) {
    boxes.sort((a, b) => {
      const ra = Math.max(a.rMax - a.rMin, a.gMax - a.gMin, a.bMax - a.bMin);
      const rb = Math.max(b.rMax - b.rMin, b.gMax - b.gMin, b.bMax - b.bMin);
      return rb - ra;
    });
    const largest = boxes[0]!;
    const split = splitBox(largest);
    if (!split) break;
    boxes.shift();
    boxes.push(split[0], split[1]);
  }

  const palette: number[][] = [];
  for (const box of boxes) {
    let rSum = 0,
      gSum = 0,
      bSum = 0;
    for (const idx of box.indices) {
      const p = pixels[idx]!;
      rSum += p.r;
      gSum += p.g;
      bSum += p.b;
    }
    const count = box.indices.length;
    palette.push([
      Math.round(rSum / count),
      Math.round(gSum / count),
      Math.round(bSum / count),
    ]);
  }

  return palette;
}

function nearestColorIdx(
  r: number,
  g: number,
  b: number,
  palette: number[][],
): number {
  let bestDist = Infinity;
  let bestIdx = 0;
  for (let j = 0; j < palette.length; j++) {
    const pc = palette[j]!;
    const d = (r - pc[0]!) ** 2 + (g - pc[1]!) ** 2 + (b - pc[2]!) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestIdx = j;
    }
  }
  return bestIdx;
}

function byteStride(data: Uint8Array | Uint8ClampedArray, n: number): number {
  const total = data.length;
  if (total === n * 4) return 4;
  if (total === n * 3) return 3;
  throw new Error(
    `data length ${total} does not match ${n} * 3 (RGB) or ${n} * 4 (RGBA)`,
  );
}

/**
 * Encode RGB or RGBA pixel data to a SIXEL string.
 * Similar API to the npm `sixel` package's `image2sixel`, but supports
 * both RGB888 (3 bytes/pixel) and RGBA (4 bytes/pixel) natively.
 */
export function image2sixel(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  maxColors = 256,
  backgroundSelect = 0,
): string {
  if (width === 0 || height === 0 || data.length === 0) return '';

  const n = width * height;
  const stride = byteStride(data, n);
  const uniqueColors = new Map<number, number>();
  const palette: number[][] = [];
  const indices = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    const pi = i * stride;
    const r = data[pi]!;
    const g = data[pi + 1]!;
    const b = data[pi + 2]!;
    const key = ((r << 16) | (g << 8) | b) >>> 0;
    let idx = uniqueColors.get(key);
    if (idx === undefined) {
      idx = palette.length;
      uniqueColors.set(key, idx);
      palette.push([r, g, b]);
    }
    indices[i] = idx;
  }

  if (palette.length > maxColors) {
    const pixels: Array<{ r: number; g: number; b: number }> = [];
    for (let i = 0; i < n; i++) {
      const pi = i * stride;
      pixels.push({ r: data[pi]!, g: data[pi + 1]!, b: data[pi + 2]! });
    }
    const quantized = medianCut(pixels, maxColors);
    palette.length = 0;
    palette.push(...quantized);
    for (let i = 0; i < n; i++) {
      const pi = i * stride;
      indices[i] = nearestColorIdx(
        data[pi]!,
        data[pi + 1]!,
        data[pi + 2]!,
        palette,
      );
    }
  }

  const parts: string[] = [introducer(backgroundSelect)];
  parts.push(`"1;1;${width};${height}`);
  for (let i = 0; i < palette.length; i++) {
    const pc = palette[i]!;
    parts.push(
      `#${i};2;${Math.round((pc[0]! / 255) * 100)};${Math.round((pc[1]! / 255) * 100)};${Math.round((pc[2]! / 255) * 100)}`,
    );
  }

  const nColors = palette.length;
  for (let band = 0; band < height; band += 6) {
    const bandH = Math.min(6, height - band);
    const targets: string[][] = [];
    const usedColorIdx: number[] = [];
    const lastCode = new Int8Array(nColors + 1);
    const curCode = new Uint8Array(nColors + 1);
    const accu = new Uint16Array(nColors + 1);
    const slots = new Int16Array(nColors + 1);
    lastCode.fill(-1);
    accu.fill(1);
    slots.fill(-1);

    for (let x = 0; x < width; x++) {
      curCode.fill(0, 0, targets.length);
      for (let y = 0; y < bandH; y++) {
        const idx = indices[(band + y) * width + x]! + 1;
        if (slots[idx] === -1) {
          slots[idx] = targets.length;
          targets.push([]);
          usedColorIdx.push(idx);
          if (x > 0) {
            lastCode[targets.length - 1] = 0;
            accu[targets.length - 1] = x;
          }
        }
        curCode[slots[idx]!]! |= 1 << y;
      }
      for (let s = 0; s < targets.length; s++) {
        if (curCode[s] === lastCode[s]) {
          accu[s]!++;
        } else {
          if (~lastCode[s]!) {
            targets[s]!.push(codeToSixel(lastCode[s]!, accu[s]!));
          }
          lastCode[s] = curCode[s]!;
          accu[s] = 1;
        }
      }
    }
    for (let s = 0; s < targets.length; s++) {
      if (lastCode[s]) {
        targets[s]!.push(codeToSixel(lastCode[s]!, accu[s]!));
      }
    }

    for (let s = 0; s < targets.length; s++) {
      const idx = usedColorIdx[s]!;
      if (idx === 0) continue;
      parts.push('#' + (idx - 1) + targets[s]!.join('') + '$');
    }

    if (band + 6 < height) {
      parts.push('-\n');
    }
  }

  parts.push(FINALIZER);
  return parts.join('');
}

export function sixelEncode(
  data: Uint8Array,
  width: number,
  height: number,
  palette: number[][],
  rasterAttributes = true,
): string {
  if (!data.length || !width || !height) return '';
  if (width * height * 4 !== data.length)
    throw new Error('wrong geometry of data');
  if (!palette || !palette.length) throw new Error('palette must not be empty');

  const n = width * height;
  const data32 = new Uint32Array(data.buffer);
  const paletteWithZero = [0];
  const paletteRGB: number[][] = [];

  for (const color of palette) {
    if (color.length === 3) {
      paletteWithZero.push(
        (color[0]! << 24) | (color[1]! << 16) | (color[2]! << 8) | 255,
      );
      paletteRGB.push(color);
    } else {
      const rgba =
        (color[0]! << 24) |
        (color[1]! << 16) |
        (color[2]! << 8) |
        (color[3] ?? 255);
      if (!((rgba >> 24) & 0xff)) continue;
      if (!~paletteWithZero.indexOf(rgba)) {
        paletteWithZero.push(rgba);
        paletteRGB.push([color[0]!, color[1]!, color[2]!]);
      }
    }
  }

  const parts: string[] = [];
  if (rasterAttributes) {
    parts.push(`"1;1;${width};${height}`);
  }

  for (let i = 0; i < paletteRGB.length; i++) {
    const [r, g, b] = paletteRGB[i]!;
    parts.push(
      `#${i};2;${Math.round((r! / 255) * 100)};${Math.round((g! / 255) * 100)};${Math.round((b! / 255) * 100)}`,
    );
  }

  const colorMap = new Map(paletteWithZero.map((el, idx) => [el, idx]));
  const nColors = paletteRGB.length;
  const bands: string[] = [];

  for (let band = 0; band < height; band += 6) {
    const bandH = Math.min(6, height - band);
    const targets: string[][] = [];
    const usedColorIdx: number[] = [];
    const lastCode = new Int8Array(nColors + 1);
    const curCode = new Uint8Array(nColors + 1);
    const accu = new Uint16Array(nColors + 1);
    const slots = new Int16Array(nColors + 1);
    lastCode.fill(-1);
    accu.fill(1);
    slots.fill(-1);

    for (let x = 0; x < width; x++) {
      curCode.fill(0, 0, targets.length);
      for (let y = 0; y < bandH; y++) {
        const px = data32[(band + y) * width + x]!;
        const color = px;
        let idx = 0;
        const a = (color >> 24) & 0xff;
        if (a) {
          idx = colorMap.get(color) || 0;
        }
        const ci = idx + 1;
        if (slots[ci] === -1) {
          slots[ci] = targets.length;
          targets.push([]);
          usedColorIdx.push(ci);
          if (x > 0) {
            lastCode[targets.length - 1] = 0;
            accu[targets.length - 1] = x;
          }
        }
        curCode[slots[ci]!]! |= 1 << y;
      }
      for (let s = 0; s < targets.length; s++) {
        if (curCode[s] === lastCode[s]) {
          accu[s]!++;
        } else {
          if (~lastCode[s]!) {
            targets[s]!.push(codeToSixel(lastCode[s]!, accu[s]!));
          }
          lastCode[s] = curCode[s]!;
          accu[s] = 1;
        }
      }
    }
    for (let s = 0; s < targets.length; s++) {
      if (lastCode[s]) {
        targets[s]!.push(codeToSixel(lastCode[s]!, accu[s]!));
      }
    }

    const bandParts: string[] = [];
    for (let s = 0; s < targets.length; s++) {
      const idx = usedColorIdx[s]!;
      if (idx === 0) continue;
      bandParts.push('#' + (idx - 1) + targets[s]!.join('') + '$');
    }
    bands.push(bandParts.join(''));
  }

  parts.push(bands.join('-\n'));
  return parts.join('');
}

export function introducer(backgroundSelect = 0): string {
  if (backgroundSelect === 0) return INTRO;
  return `\x1bP0;${backgroundSelect};q`;
}

export { FINALIZER };
