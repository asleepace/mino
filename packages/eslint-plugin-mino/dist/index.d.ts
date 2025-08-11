/**
 * Minimal ESLint preprocessor-style plugin for Mino-like files.
 * It exposes a processor that converts .mino/.jsxm into plain JS
 * by turning @html/@css blocks into template strings so ESLint can parse.
 */
export declare const processors: {
    '.mino': {
        preprocess(text: string): string[];
        postprocess(messages: any[][]): any[];
    };
    '.jsxm': {
        preprocess(text: string): string[];
        postprocess(messages: any[][]): any[];
    };
};
