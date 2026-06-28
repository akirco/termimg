## 用法

```ts
import { renderImage, detectProtocol } from 'termimg'

// 自动检测协议，输出到终端
const output = await renderImage('photo.jpg')
process.stdout.write(output)

// 指定协议
const out2 = await renderImage('photo.jpg', { protocol: 'kitty' })
process.stdout.write(out2)

// 手动检测协议
const proto = detectProtocol() // 'kitty' | 'sixel' | 'halfblock'
console.log(proto)

const out3 = await renderImage('photo.jpg', { scale: 0.5 })
process.stdout.write(out3)

const out4 = await renderImage('photo.jpg', { cols: 80 })
process.stdout.write(out4)

import { KittyEncoder, SixelEncoder, HalfBlockEncoder } from 'termimg'
import { loadImage, resizeImage } from 'termimg'

const img = await loadImage('photo.jpg')
const resized = await resizeImage(img, 400, 300)
const encoder = new KittyEncoder()
const out = encoder.encode(resized.width, resized.height, resized.data)
process.stdout.write(out)
```

## CLI 用法

```bash
bun src/cli.ts photo.jpg
bun src/cli.ts photo.jpg --scale 0.5
bun src/cli.ts photo.jpg --cols 80
bun src/cli.ts photo.jpg --protocol kitty
bun src/cli.ts photo.jpg --protocol sixel --no-aspect

bun run build
```
