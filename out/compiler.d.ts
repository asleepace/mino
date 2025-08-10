export declare class MinoCompiler {
    private readonly emitExports;
    constructor(options?: {
        emitExports?: boolean;
    });
    compile(source: string, fileName: string): Promise<string>;
    private transformSource;
    private readBalancedBraces;
    private skipQuoted;
    private skipBlockComment;
    private skipLine;
    private detectParams;
    private extractRootIdentifier;
    private skipInterpolation;
    private trimOuterWhitespace;
}
//# sourceMappingURL=compiler.d.ts.map