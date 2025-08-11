# Developer Notes

This document outlines development notes, tips and debugging hints.

## File icon behavior in VS Code

Explorer file icons come from the active file icon theme.

To show a custom icon next to .mino under third-party themes (e.g., Material Icon Theme), the language contribution must reference SVGs:
In package.json → contributes.languages[id:"mino"].icon:

```json
{
    "dark": "./icons/mino-dark.svg",
    "light": "./icons/mino-light.svg"
}
```
PNG is fine for the extension/marketplace card, but many themes only consume SVG for per-language icons.
Our bundled icon theme fileicons/mino-icon-theme.json can show a PNG next to files, but the user must select “Mino Icons” as their file icon theme.
We avoid a file decoration badge to prevent extra overlays.

## Tips

If the icon doesn’t appear after changing assets, switch to a different icon theme and back, then reload the window.
For Material Icon Theme, you can map patterns via settings:

```json
{
    "material-icon-theme.files.associations": {
    ".mino": "html"
    }
}
```

## Troubleshooting

In VSCode / Cursor during development you should use the following commands:

<kbd>CMD</kbd> + <kbd>SHIFT</kbd> + <kbd>P</kbd>

To use the following to help troubleshoot:

```
Developer: Reload Window
Developer: Toggle Developer Tools
Developer: Cleanup Extensions Folder
Mino: Compile Mino File
```