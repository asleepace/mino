# !/bin/zsh
# 1. Ensure everything compiles cleanly
npm run compile

# 2. Package the extension
npx @vscode/vsce package

# 3. Test the packaged extension
code --install-extension mino-lang-*.vsix