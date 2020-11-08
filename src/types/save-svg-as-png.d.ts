// Type definitions for saveSvgAsPng v1.0.3
// Project: https://github.com/exupero/saveSvgAsPng

declare module "save-svg-as-png" {
    export type SourceElement = HTMLElement | SVGElement | Element

    export type BackgroundStyle = string | CanvasGradient | CanvasPattern

    export interface SelectorRemap {
        (text: string): string
    }

    export interface SaveSVGOptions {
        scale?: number
        responsive?: boolean
        width?: number
        height?: number
        left?: number
        top?: number
        selectorRemap?: SelectorRemap
        backgroundColor?: BackgroundStyle
    }

    export interface UriCallback {
        (uri: string): void
    }

    export function svgAsDataUri(el: SourceElement, options: SaveSVGOptions, cb: UriCallback): void

    export function svgAsPngUri(el: SourceElement, options: SaveSVGOptions, cb: UriCallback): void

    export function saveSvg(el: SourceElement, fileName: string, options?: SaveSVGOptions): void

    export function saveSvgAsPng(
        el: SourceElement,
        fileName: string,
        options?: SaveSVGOptions,
    ): void
}
