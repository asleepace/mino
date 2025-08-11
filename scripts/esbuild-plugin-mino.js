const { MinoCompiler } = require('../out/compiler.js');

module.exports = function minoEsbuildPlugin() {
  const compiler = new MinoCompiler();
  return {
    name: 'mino-esbuild',
    setup(build) {
      build.onLoad({ filter: /\.(jsxm|mino)$/ }, async (args) => {
        const fs = require('fs');
        const code = fs.readFileSync(args.path, 'utf8');
        const out = await compiler.compile(code, args.path);
        return { contents: out, loader: 'js' };
      });
    }
  };
};


