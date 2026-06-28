import type { ImageData, ImageSource } from './types.ts';
export declare function loadImage(source: ImageSource): Promise<ImageData>;
export declare function resizeImage(image: ImageData, targetW: number, targetH: number): Promise<ImageData>;
export declare function isImageExtension(path: string): boolean;
