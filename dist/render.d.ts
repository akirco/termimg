import type { ImageSource, RenderOptions } from './types.ts';
export interface RenderResult {
    stream: string;
    cols: number;
    rows: number;
}
export declare function renderImage(source: ImageSource, options?: RenderOptions): Promise<RenderResult>;
