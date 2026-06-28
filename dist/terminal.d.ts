import type { ImageProtocol } from "./types.ts";
export declare function terminalSize(): {
    cols: number;
    rows: number;
};
export declare function ensureCellSize(): Promise<{
    cw: number;
    ch: number;
}>;
export interface FitResult {
    targetW: number;
    targetH: number;
}
export declare function fitDimensions(origW: number, origH: number, protocol: ImageProtocol, options?: {
    scale?: number;
    cols?: number;
    rows?: number;
    preserveAspectRatio?: boolean;
}): FitResult;
