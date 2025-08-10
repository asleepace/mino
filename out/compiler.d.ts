export declare class MinoCompiler {
    compile(source: string, fileName: string): Promise<string>;
    validate(source: string, fileName: string): Promise<void>;
    private extractComponentName;
    private toKebabCase;
    private basicTransform;
}
//# sourceMappingURL=compiler.d.ts.map