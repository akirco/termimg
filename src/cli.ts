import { isImageExtension } from './image.ts';
import { renderImage } from './index.ts';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`Usage: termimg <image> [options]

Options:
  --scale <n>       Scale factor (default: 1.0)
  --cols <n>        Fixed width in character columns
  --rows <n>        Fixed height in character rows
  --protocol <p>    Force protocol: kitty, sixel, halfblock, braille, ascii, auto
  --x <n>           Horizontal offset in character cells (default: 0)
  --y <n>           Vertical offset in character cells (default: 0)
  --no-aspect       Do not preserve aspect ratio`);
    process.exit(0);
  }

  const path = args[0]!;

  if (!isImageExtension(path)) {
    console.error(`Unsupported image format: ${path}`);
    process.exit(1);
  }

  let scale: number | undefined;
  let cols: number | undefined;
  let rows: number | undefined;
  let protocol: string | undefined;
  let preserveAspectRatio = true;
  let x: number | undefined;
  let y: number | undefined;

  for (let i = 1; i < args.length; i++) {
    switch (args[i]) {
      case '--scale':
        scale = parseFloat(args[++i]!);
        break;
      case '--cols':
        cols = parseInt(args[++i]!, 10);
        break;
      case '--rows':
        rows = parseInt(args[++i]!, 10);
        break;
      case '--protocol':
        protocol = args[++i];
        break;
      case '--x':
        x = parseInt(args[++i]!, 10);
        break;
      case '--y':
        y = parseInt(args[++i]!, 10);
        break;
      case '--no-aspect':
        preserveAspectRatio = false;
        break;
    }
  }

  try {
    const result = await renderImage(path, {
      scale,
      cols,
      rows,
      protocol: protocol as any,
      preserveAspectRatio,
      x,
      y,
    });
    process.stdout.write(result.stream);
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
