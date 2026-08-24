# Change Log

All notable changes to the "rebuilder-vscode" extension will be documented in this file.

## [1.0.0] - 2026-08-24

### Added
- **Language Support**: Official language mode and file association for `.rebuilder` Single-File Components.
- **Syntax Highlighting**:
  - Frontmatter YAML configuration (`path`, `title`, `window`, `requireAuth`).
  - Embedded TypeScript / JavaScript syntax highlighting inside `<script>`.
  - Embedded HTML with directive support (`@click`, `:disabled`, `:class`) and `{expression}` interpolation inside `<template>`.
  - Control flow tags (`<Show>`, `<For>`) highlighting.
  - Embedded CSS syntax highlighting inside `<style>`.
- **Snippets**:
  - `reb-page`: Scaffold complete `.rebuilder` page with YAML frontmatter.
  - `reb-comp`: Scaffold basic `.rebuilder` component.
  - `reb-state`: Declare reactive signal `useState(initial)`.
  - `reb-show`: Insert `<Show when={...} fallback={...}>`.
  - `reb-for`: Insert `<For each={...}>`.
- **Language Configuration**:
  - Auto-closing pairs for `{ }`, `[ ]`, `( )`, `< >`, and quotes.
  - HTML and JS line & block comments (`//` and `<!-- -->`).
  - Code folding regions.
