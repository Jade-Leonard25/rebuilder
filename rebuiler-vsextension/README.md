# Rebuilder Language Support for Visual Studio Code

Official VS Code extension providing rich language support, syntax highlighting, bracket matching, and snippets for **Rebuilder** (`.rebuilder`) Single-File Components.

---

## Features

- **Full Syntax Highlighting**:
  - **YAML Frontmatter**: Metadata, route configuration, and Electron desktop window settings.
  - **`<script>` Block**: Full TypeScript and JavaScript language highlighting with signal primitives.
  - **`<template>` Block**: HTML element tags, directives (`@click`, `:disabled`, `:class`), and dynamic `{expression}` interpolations.
  - **Control Flow Elements**: Dedicated styling for `<Show>` and `<For>` tags.
  - **`<style>` Block**: CSS syntax highlighting with scoped style support.
- **Smart Snippets**: Rapidly scaffold pages, components, signals, and control flow blocks with tab stops.
- **Auto-Closing & Formatting**: Auto-closing tags, bracket matching, and comment toggle support (`//` and `<!-- -->`).

---

## Syntax Example (`example.rebuilder`)

```html
---
path: "/dashboard"
title: "User Dashboard"
requireAuth: true
window:
  width: 1200
  height: 800
---

<script>
  const count = useState(0);
  const user = useState("Admiral");

  function increment() {
    count.update(c => c + 1);
  }
</script>

<template>
  <div class="p-8 bg-slate-900 text-white min-h-screen space-y-6">
    <h1 class="text-3xl font-bold">Welcome, {user}!</h1>
    
    <div class="flex items-center gap-4">
      <button 
        class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 cursor-pointer"
        @click={increment}
        :disabled={() => count.value >= 10}
      >
        + Increment
      </button>

      <span class="text-xl font-mono text-emerald-400 font-bold">
        Count: {count}
      </span>
    </div>

    <!-- Conditional Rendering -->
    <Show when={() => count.value >= 5}>
      <p class="text-amber-400">🎉 Milestone reached (>= 5)!</p>
    </Show>
  </div>
</template>

<style scoped>
  h1 {
    letter-spacing: -0.025em;
  }
</style>
```

---

## Available Snippets

| Prefix | Description | Output |
| :--- | :--- | :--- |
| `reb-page` | Scaffold a complete `.rebuilder` page | YAML frontmatter + `<script>` + `<template>` |
| `reb-comp` | Scaffold a `.rebuilder` component | `<script>` + `<template>` component shell |
| `reb-state` | Declare a reactive signal | `const name = useState(initial);` |
| `reb-show` | Conditional rendering block | `<Show when={...} fallback={...}>` |
| `reb-for` | Reactive list iteration block | `<For each={...}>` |

---

## Installation

### From VS Code Marketplace (Coming Soon)
1. Open VS Code.
2. Open the Extensions pane (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Search for **Rebuilder Language Support**.
4. Click **Install**.

### Local Installation
1. Copy or symlink the `rebuiler-vsextension` folder into your extensions directory:
   - **Windows**: `%USERPROFILE%\.vscode\extensions\rebuilder-vscode`
   - **macOS / Linux**: `~/.vscode/extensions/rebuilder-vscode`
2. Reload VS Code (`Ctrl+Shift+P` -> `Developer: Reload Window`).
3. Open any `.rebuilder` file.

---

## Requirements

- Visual Studio Code version `1.75.0` or higher.

---

## Release Notes

### 1.0.0
- Initial release with complete TextMate grammar for `.rebuilder` files.
- Added embedded TypeScript, CSS, YAML, and HTML directive highlighting.
- Added snippet library for fast component generation.
