import type { ImageProtocol } from './types.ts';
export interface ClearOptions {
    cols: number;
    rows: number;
    x?: number;
    y?: number;
}
export declare function clearImage(protocol: ImageProtocol, options: ClearOptions): Promise<string>;
