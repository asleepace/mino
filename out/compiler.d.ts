export declare class MinoCompiler {
    private readonly emitExports;
    private readonly emitFunctions;
    constructor(options?: {
        emitExports?: boolean;
        emitFunctions?: boolean;
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
    private buildJsDocForAssignment;
    private readBalancedParens;
    private convertJsxBracesToTemplate;
}
//# sourceMappingURL=compiler.d.ts.map