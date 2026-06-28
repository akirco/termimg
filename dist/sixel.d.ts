declare const FINALIZER = "\u001B\\";
/**
 * Encode RGB or RGBA pixel data to a SIXEL string.
 * Similar API to the npm `sixel` package's `image2sixel`, but supports
 * both RGB888 (3 bytes/pixel) and RGBA (4 bytes/pixel) natively.
 */
export declare function image2sixel(data: Uint8Array | Uint8ClampedArray, width: number, height: number, maxColors?: number, backgroundSelect?: number): string;
export declare function sixelEncode(data: Uint8Array, width: number, height: number, palette: number[][], rasterAttributes?: boolean): string;
export declare function introducer(backgroundSelect?: number): string;
export { FINALIZER };
