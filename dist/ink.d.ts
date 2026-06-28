import type { ImageSource, RenderOptions } from './types.ts';
export interface ImageProps extends RenderOptions {
    source: ImageSource;
}
export declare function Image({ source, ...options }: ImageProps): import("react").JSX.Element;
