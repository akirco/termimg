# termimg

终端图片预览库 — Kitty, Sixel, HalfBlock, Braille, ASCII

自动检测终端支持的协议，将图片渲染到终端中。支持 JPG、PNG、GIF、WebP、AVIF 等主流格式。

## 安装

```bash
npm install @akirco/termimg
# or
bun add @akirco/termimg
```

## 使用

### 基本用法

```ts
import { renderImage } from '@akirco/termimg'

const result = await renderImage('photo.jpg')
process.stdout.write(result.stream)
```

自动检测终端协议并输出渲染结果。

### 指定协议

```ts
const result = await renderImage('photo.jpg', { protocol: 'kitty' })
process.stdout.write(result.stream)
```

### 手动检测协议

```ts
import { detectProtocol } from 'termimg'

const proto = detectProtocol() // 'kitty' | 'sixel' | 'halfblock'
```

### 调整尺寸

```ts
// 缩放
await renderImage('photo.jpg', { scale: 0.5 })

// 固定宽度（字符列数）
await renderImage('photo.jpg', { cols: 80 })

// 固定高度（字符行数）
await renderImage('photo.jpg', { rows: 24 })

// 指定偏移
await renderImage('photo.jpg', { x: 10, y: 5 })
```

### 底层 API

```ts
import { loadImage, resizeImage, KittyEncoder } from '@akirco/termimg'

const img = await loadImage('photo.jpg')
const resized = await resizeImage(img, 400, 300)
const encoder = new KittyEncoder()
const output = encoder.encode(resized.width, resized.height, resized.data)
process.stdout.write(output)
```

### 清除图片

```ts
import { clearImage } from '@akirco/termimg'

const clear = await clearImage('kitty', { cols: 40, rows: 20 })
process.stdout.write(clear)
```

## CLI

```bash
termimg photo.jpg
termimg photo.jpg --scale 0.5
termimg photo.jpg --cols 80
termimg photo.jpg --protocol kitty
termimg photo.jpg --protocol sixel --no-aspect
```

### 选项

| 选项 | 说明 |
|------|------|
| `--scale <n>` | 缩放比例（默认 1.0） |
| `--cols <n>` | 固定宽度（字符列数） |
| `--rows <n>` | 固定高度（字符行数） |
| `--protocol <p>` | 强制协议：kitty, sixel, halfblock, braille, ascii, auto |
| `--x <n>` | 水平偏移（字符单位） |
| `--y <n>` | 垂直偏移（字符单位） |
| `--no-aspect` | 不保持宽高比 |

## 终端兼容性

| 协议 | 终端 |
|------|------|
| **Kitty** | Kitty, Ghostty, Rio, Warp, WezTerm, iTerm2 (≥3.4), Konsole (≥22.04) |
| **Sixel** | Foot, VS Code (≥1.80), Rio (≥12), WezTerm, Mintty, Konsole (≥22.04), mlterm |
| **HalfBlock** | 通用回退方案 |
| **Braille** | 通用回退方案 |
| **ASCII** | 通用回退方案 |

## License

AGPL-3.0-or-later
