/**
 * Math Extension Types
 * @description Math formula editor type definitions
 */

export interface MathNodeAttrs {
  /** LaTeX formula content */
  latex: string
  /** Whether it is a block formula */
  block: boolean
}

export interface MathExtensionOptions {
  /** Whether to enable inline formula */
  inline?: boolean
  /** Whether to enable block formula */
  block?: boolean
  /** KaTeX rendering options */
  katexOptions?: KatexRenderOptions
}

export interface KatexRenderOptions {
  /** Whether to display error messages */
  throwOnError?: boolean
  /** Error color */
  errorColor?: string
  /** Whether to use strict mode */
  strict?: boolean | string
  /** Whether to trust input */
  trust?: boolean
  /** Macro definitions */
  macros?: Record<string, string>
}

export const DEFAULT_KATEX_OPTIONS: KatexRenderOptions = {
  throwOnError: false,
  errorColor: '#cc0000',
  strict: false,
  trust: false,
}
