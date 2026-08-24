# Extension Quickstart Guide

## Overview

This folder contains the **Rebuilder VS Code Extension** for `.rebuilder` Single-File Components.

## Folder Structure

```
rebuiler-vsextension/
├── package.json                   # Extension manifest
├── language-configuration.json    # Auto-closing, brackets, comments
├── syntaxes/
│   └── rebuilder.tmLanguage.json  # TextMate syntax grammar
├── snippets/
│   └── rebuilder.json             # Code snippets
├── .vscodeignore                  # Packaging exclusions
├── .gitignore                     # Git exclusions
├── CHANGELOG.md                   # Version history
├── README.md                      # Marketplace documentation
└── vsc-extension-quickstart.md    # Developer guide (this file)
```

## Running & Testing the Extension Locally

1. Press `F5` in VS Code or open a new window with this extension loaded:
   - **Windows**: Copy or symlink this folder to `%USERPROFILE%\.vscode\extensions\rebuilder-vscode`
   - **macOS/Linux**: Copy or symlink this folder to `~/.vscode/extensions/rebuilder-vscode`
2. Reload VS Code (`Ctrl+Shift+P` -> `Developer: Reload Window`).
3. Open any `.rebuilder` file (e.g. `src/pages/counter.rebuilder`) to see syntax highlighting and test snippets.

## Packaging for Marketplace (.vsix)

1. Install `vsce` if needed:
   ```bash
   npm install -g @vscode/vsce
   ```
2. Build `.vsix` package:
   ```bash
   cd rebuiler-vsextension
   vsce package
   ```
3. Publish to VS Code Marketplace:
   ```bash
   vsce publish
   ```
