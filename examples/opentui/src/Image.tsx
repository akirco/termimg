import {
  OptimizedBuffer,
  Renderable,
  RGBA,
  type RenderableOptions,
  type RenderContext,
} from "@opentui/core";
import { extend } from "@opentui/react";
import type { ImageProtocol } from "../../../dist";
import { renderImage } from "../../../dist";

export interface TermImageOptions extends RenderableOptions<TermImageRenderable> {
  src: string;
  cols?: number;
  rows?: number;
  protocol?: ImageProtocol | "auto";
  preserveAspectRatio?: boolean;
}

export class TermImageRenderable extends Renderable {
  private _src: string;
  private _cols: number;
  private _rows: number;
  private _protocol: ImageProtocol | "auto";
  private _preserveAspectRatio: boolean | undefined;
  private _imageStream: string = "";
  private _imageReady: boolean = false;
  private _loadingPromise: Promise<void> | null = null;

  constructor(ctx: RenderContext, options: TermImageOptions) {
    super(ctx, {
      ...options,
    } as RenderableOptions<Renderable>);

    this.selectable = false;
    this.focusable = false;

    this._src = options.src;
    this._protocol = options.protocol ?? "auto";
    this._cols = options.cols ?? this.width;
    this._rows = options.rows ?? this.height;
    this._preserveAspectRatio = options.preserveAspectRatio;
  }

  get src(): string {
    return this._src;
  }
  set src(value: string) {
    if (this._src !== value) {
      this._src = value;
      this._imageReady = false;
      this._loadingPromise = null;
      this.loadImage();
      this.requestRender();
    }
  }

  get cols(): number {
    return this._cols;
  }
  set cols(value: number) {
    if (this._cols !== value) {
      this._cols = value;
      this._imageReady = false;
      this._loadingPromise = null;
      this.loadImage();
      this.requestRender();
    }
  }

  get rows(): number {
    return this._rows;
  }
  set rows(value: number) {
    if (this._rows !== value) {
      this._rows = value;
      this._imageReady = false;
      this._loadingPromise = null;
      this.loadImage();
      this.requestRender();
    }
  }

  private async loadImage(): Promise<void> {
    if (this._loadingPromise) return;

    this._imageReady = false;
    this._imageStream = "";

    this._loadingPromise = renderImage(this._src, {
      cols: this._cols,
      rows: this._rows,
      x: this.x,
      y: this.y,
      preserveAspectRatio: this._preserveAspectRatio,
      protocol: this._protocol,
    })
      .then((result) => {
        this._imageStream = result.stream;
        this._cols = result.cols;
        this._rows = result.rows;

        this._imageReady = true;
        this.requestRender();
      })
      .catch(() => {
        this._imageStream = `\x1b[31mImage read failed...\x1b[0m`;
        this.requestRender();
      })
      .finally(() => {
        this._loadingPromise = null;
      });

    await this._loadingPromise;
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    // super.renderSelf(buffer);

    if (!this._imageReady && !this._loadingPromise) {
      this.loadImage();
    }

    if (!this._imageReady) {
      const msg = `loading image...`;
      buffer.drawText(msg, this.x, this.y, RGBA.fromValues(128, 128, 128, 0.5));
      return;
    }

    setImmediate(() => this._drawImageToTerminal());
  }

  private _drawImageToTerminal(): void {
    if (!this._imageReady) return;

    process.stdout.write(this._imageStream);
  }

  public override destroy(): void {
    super.destroy();
  }
}

extend({
  termImage: TermImageRenderable,
});
