export type ImageProtocol = 'kitty' | 'sixel' | 'halfblock' | 'braille' | 'ascii';
export type ImageSource = string | Uint8Array | Buffer;
export interface ImageData {
    width: number;
    height: number;
    data: Uint8Array;
}
export interface RenderOptions {
    scale?: number;
    cols?: number;
    rows?: number;
    protocol?: ImageProtocol | 'auto';
    preserveAspectRatio?: boolean;
    x?: number;
    y?: number;
}
export declare const PROTOCOL_PRIORITY: ImageProtocol[];
export declare const IMAGE_EXTENSIONS: Set<string>;
