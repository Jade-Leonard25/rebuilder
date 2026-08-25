# Rebuilder Framework Extensibility

Learn how to extend Rebuilder with other libraries, frameworks, and custom generators.

## Using Other Libraries & Frameworks

Rebuilder is designed to work seamlessly with any npm package. Since it outputs standard HTML/CSS/JS, you can integrate any library that works in a browser or Electron environment.

### Popular Integrations

#### UI Component Libraries
```
# Install and use with Rebuilder components
npm install @mui/material @emotion/react @emotion/styled
npm install antd
npm install @headlessui/react
npm install @radix-ui/react-icons
```

#### Utility Libraries
```
# Date handling
npm install date-fns
npm install luxon

# HTTP requests
npm install axios
npm install ky

# State management (if needed beyond signals)
npm install zustand
npm install jotai
```

#### Electron-Specific
```
npm install electron-is-dev
npm install electron-store
npm install electron-updater
npm install @electron/remote
```

### Example: Using Three.js in a Rebuilder Component

Create a `ThreeView.rebuilder` file:

```rebuilder
---
name: ThreeView
---

<script lang="ts">
import { onMount, onCleanup } from '@rebuilder/system';
import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationFrameId: number;

onMount(() => {
  const canvas = document.createElement('canvas');
  const container = document.getElementById('three-container')!;
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ canvas });
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  
  // Add a cube
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  camera.position.z = 5;
  
  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  
  animate();
});

onCleanup(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  renderer.dispose();
});

export default function ThreeView() {
  return (
    <div id="three-container" className="w-full h-96 border rounded">
      {/* Three.js canvas will be mounted here */}
    </div>
  );
}
</script>

<style>
#three-container {
  background: #f0f0f0;
}
</style>
```

## Creating Custom Electron Generators

Yes! You can absolutely create your own Electron build plugins and generators like `rebuilder-electron-build-plugin`. Rebuilder's architecture is designed to be extensible.

### Why Create Custom Generators?

1. **Team Standards**: Enforce consistent project structures
2. **Domain-Specific Templates**: Create generators for specific app types (dashboard, data visualization, etc.)
3. **Custom Installers**: Build specialized Electron installers (MSI, PKG, DMG, AppImage)
4. **Workflow Automation**: Create generators that set up CI/CD, testing, or deployment pipelines

### How Rebuilder's Generator System Works

Rebuilder's CLI uses a plugin-based architecture where generators are simply Node.js modules that follow a specific interface.

### Example: Creating `rebuilder-electron-build-plugin`

Here's how you might structure a custom Electron builder plugin:

#### 1. Plugin Structure
```
rebuilder-electron-build-plugin/
├── package.json
├── src/
│   ├── index.ts          # Main entry point
│   ├── generators/
│   │   ├── base-app.ts   # Base Electron app generator
│   │   ├── installer.ts  # Custom installer generator
│   │   └── updater.ts    # Auto-update generator
│   └── utils/
│       ├── file-templates.ts
│       └── electron-helpers.ts
├── templates/
│   ├── electron-base/
│   │   ├── main.ts
│   │   ├── preload.ts
│   │   └── index.html
│   └── installers/
│       ├── windows/
│       │   └── installer.nsi
│       └── macos/
│           └── installer.applescript
└── README.md
```

#### 2. Package.json Configuration
```json
{
  "name": "rebuilder-electron-build-plugin",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "rebuilder-electron-build": "./dist/cli/index.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch"
  },
  "peerDependencies": {
    "rebuilder-framework-cli": "^1.0.0"
  }
}
```

#### 3. Main Entry Point (src/index.ts)
```typescript
import { GeneratorPlugin } from 'rebuilder-framework-cli/types';
import { BaseAppGenerator } from './generators/base-app';
import { InstallerGenerator } from './generators/installer';
import { UpdaterGenerator } from './generators/updater';

export const plugin: GeneratorPlugin = {
  name: 'electron-build',
  version: '1.0.0',
  generators: {
    'electron-app': BaseAppGenerator,
    'electron-installer': InstallerGenerator,
    'electron-updater': UpdaterGenerator
  },
  
  // Optional: Hooks that run during Rebuilder lifecycle
  hooks: {
    'pre-build': async (context) => {
      // Run before app build - could minify assets, etc.
    },
    'post-build': async (context) => {
      // Run after build - could create installers, sign binaries, etc.
    }
  }
};
```

#### 4. Base Generator Example
```typescript
// src/generators/base-app.ts
import { Generator, GeneratorContext } from 'rebuilder-framework-cli/types';
import { writeFile, copy, ensureDir } from 'fs-extra';
import { join } from 'path';

export class BaseAppGenerator implements Generator {
  async generate(context: GeneratorContext) {
    const { name, options } = context;
    const dest = join(process.cwd(), name);
    
    await ensureDir(dest);
    
    // Copy base Electron template
    await copy(
      join(__dirname, '../../templates/electron-base'),
      dest
    );
    
    // Customize package.json
    const packageJson = await readFile(join(dest, 'package.json'), 'utf-8');
    const customized = packageJson
      .replace('{{APP_NAME}}', name)
      .replace('{{APP_VERSION}}', options.version || '1.0.0')
      .replace('{{MAIN_WINDOW_WIDTH}}', String(options.width || 1200))
      .replace('{{MAIN_WINDOW_HEIGHT}}', String(options.height || 800));
    
    await writeFile(join(dest, 'package.json'), customized);
    
    // Generate main process if customized
    if (options.customMain) {
      await writeFile(
        join(dest, 'main.ts'),
        options.customMain
      );
    }
    
    console.log(`✅ Generated Electron app: ${name}`);
  }
}
```

### Using Your Custom Generator

Once published to npm, others can use it:

```
# Install your plugin globally or locally
npm install -g rebuilder-electron-build-plugin

# Generate a new Electron app with your custom template
rebuilder-electron-build generate:electron-app my-electron-app \
  --version="2.0.0" \
  --width=1400 \
  --height=900 \
  --with-installer \
  --auto-updater
```

### Publishing Your Generator

1. **Create the plugin** as a separate npm package
2. **Add peerDependencies** on `rebuilder-framework-cli`
3. **Publish to npm**: `npm publish --access public`
4. **Document usage** in your plugin's README
5. **Users install** it alongside Rebuilder: `npm install rebuilder-framework-cli rebuilder-electron-build-plugin`

## Advanced Customization Ideas

### 1. Domain-Specific Generators
- `rebuilder-dashboard-plugin`: Pre-built dashboard layouts with charts
- `rebuilder-data-viz-plugin`: Templates for data visualization apps
- `rebuilder-game-plugin`: Boilerplate for Electron games with Canvas/WebGL

### 2. Custom Installers
- MSI/WIX installers for Windows
- PKG/DMG creators for macOS
- AppImage/Snap/Flatpak for Linux
- Cross-platform solutions like Electron Forge or electron-builder integration

### 3. Enterprise Features
- License key validation generators
- Telemetry and analytics setup
- Enterprise SSO/authentication templates
- Custom update servers with private keys

### 4. Workflow Automation
- CI/CD pipeline generators (GitHub Actions, GitLab CI)
- Testing setup (Jest, Playwright, Spectron)
- Performance testing configurations
- Documentation generators

## Best Practices for Custom Generators

### 1. Follow Rebuilder Conventions
- Use TypeScript for type safety
- Leverage Rebuilder's signal system where applicable
- Maintain consistent file structure conventions

### 2. Make Generators Configurable
- Accept options parameters for customization
- Provide sensible defaults
- Allow template overrides

### 3. Handle Electron-Specific Concerns
- Main vs preload vs renderer process distinctions
- Node.js integration/context isolation
- Security considerations (context bridging, IPC)
- Packaging considerations (asar, native modules)

### 4. Provide Excellent Documentation
- Clear usage examples
- Configuration option references
- Troubleshooting guides
- Contribution guidelines

## Getting Started

To create your first custom generator:

1. **Create a new npm package**: `npm init rebuilder-plugin-name`
2. **Add Rebuilder as peerDependency**: `npm install --save-dev rebuilder-framework-cli`
3. **Implement the GeneratorPlugin interface**
4. **Create your generator classes**
5. **Add templates and utilities**
6. **Test locally**: `npm link` then use with `rebuilder plugin:your-plugin`
7. **Publish**: `npm publish`

## Community & Sharing

Once you've created useful generators:
- Share them on npm with the `rebuilder-` prefix
- Add topics: `rebuilder-plugin`, `electron-generator`, etc.
- Consider creating a showcase in the Rebuilder ecosystem
- Contribute particularly useful ones back to the main Rebuilder org

Remember: Rebuilder's power comes from its flexibility. Whether you're integrating cutting-edge web technologies or building specialized Electron tooling, the framework is designed to adapt to your needs.