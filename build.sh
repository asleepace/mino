# !/bin/zsh
# 1. Ensure everything compiles cleanly
rm -rf node_modules package-lock.json mino-lang-*.vsix
npm i 

npm run compile

# 2. Package the extension
npx @vscode/vsce package

# 3. Test the packaged extension
code --install-extension mino-lang-*.vsix