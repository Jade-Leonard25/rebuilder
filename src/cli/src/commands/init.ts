import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function initProject(projectName: string) {
  if (!projectName) {
    console.log(chalk.red('❌ Please provide a project name.'));
    console.log('Example: npx rebuilder-framework-cli init my-app');
    process.exit(1);
  }

  const targetDir = path.join(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    console.log(chalk.red(`❌ Directory "${projectName}" already exists.`));
    process.exit(1);
  }

  console.log(chalk.blue(`🚀 Creating new Rebuilder project in ${targetDir}...`));

  await fs.ensureDir(targetDir);

  // The root of the npm package is three levels up from src/cli/dist/commands/init.js
  const packageRoot = path.join(__dirname, '..', '..', '..', '..');

  // Files and folders to copy from the framework verbatim
  const itemsToCopy = [
    'ui',
    'tsconfig.json',
    'index.html',
    'global.d.ts',
  ];

  for (const item of itemsToCopy) {
    const srcPath = path.join(packageRoot, item);
    const destPath = path.join(targetDir, item);
    if (fs.existsSync(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  // Generate vite.config.ts
  const viteConfigContent = `import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { rebuilderPlugin } from 'rebuilder-framework-cli/src/compiler/vite-plugin-rebuilder.ts';

const rootDir = process.cwd();

export default defineConfig({
  plugins: [
    rebuilderPlugin(),
    tailwindcss(),
    electron([
      {
        entry: 'node_modules/rebuilder-framework-cli/dist/electron/main.cjs',
        onstart(options) { options.startup(); },
      },
      {
        entry: 'node_modules/rebuilder-framework-cli/dist/electron/preload.cjs',
        onstart(options) { options.reload(); },
      },
    ]),
    renderer(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
      '@rebuilder/system': 'rebuilder-framework-cli/src/system',
      '@rebuilder/config': 'rebuilder-framework-cli/src/config',
    },
    extensions: ['.mjs', '.js', '.ts', '.json', '.rebuilder'],
  },
  root: rootDir,
  build: { outDir: 'dist', emptyOutDir: true },
});
`;
  await fs.writeFile(path.join(targetDir, 'vite.config.ts'), viteConfigContent);

  // Generate src/main.ts
  await fs.ensureDir(path.join(targetDir, 'src'));
  const mainTsContent = `import './index.css';
import { r } from '@rebuilder/system/factory';
import { createNavigation, type RouteConfig, type RouteContext } from '@rebuilder/config/config';

// Auto-discover all generated routes in src/routing/*/index.ts
const routeModules = import.meta.glob<{
  default: (context: RouteContext) => HTMLElement;
  metadata?: { path?: string; title?: string; requireAuth?: boolean; roles?: string[] };
}>('./routing/*/index.ts', { eager: true });

const allRoutes: RouteConfig[] = Object.values(routeModules).map((mod) => ({
    path: mod.metadata?.path || '/',
    title: mod.metadata?.title,
    component: mod.default,
    requireAuth: mod.metadata?.requireAuth,
    roles: mod.metadata?.roles,
}));

const app = document.getElementById('app');

// Default App Layout
function AppLayout(context: RouteContext): HTMLElement {
  const childElement = context.state?.children as HTMLElement;
  return r.div({ className: 'min-h-screen bg-slate-900 text-slate-100 p-6 font-sans' },
    r.header({ className: 'mb-8 border-b border-slate-700 pb-4' },
      r.h1({ className: 'text-2xl font-bold text-emerald-400' }, 'My Rebuilder App')
    ),
    r.main({ className: 'w-full mx-auto' }, childElement)
  );
}

if (app) {
  const navigation = createNavigation({
    container: app,
    routes: allRoutes,
    defaultLayout: AppLayout,
  });

  const initialHash = window.location.hash ? window.location.hash.replace(/^#+/, '') : '/';
  navigation.navigate(initialHash);
}
`;
  await fs.writeFile(path.join(targetDir, 'src', 'main.ts'), mainTsContent);

  // Generate src/index.css
  const cssContent = `@import "tailwindcss";`;
  await fs.writeFile(path.join(targetDir, 'src', 'index.css'), cssContent);

  // Generate a default router example
  await fs.ensureDir(path.join(targetDir, 'src', 'routing', 'home'));
  const homeRouterContent = `import type { RouteContext } from '@rebuilder/config/config';
import { r } from '@rebuilder/system/factory';

export const metadata = {
  title: 'Home',
  path: '/',
  requireAuth: false,
  layout: 'default',
};

export default function HomePage(context?: RouteContext) {
  return r.div(
    { className: 'p-6 max-w-4xl mx-auto space-y-4' },
    r.h2({ className: 'text-2xl font-bold text-gray-100' }, 'Welcome to Rebuilder!'),
    r.p({ className: 'text-gray-400' }, 'This is your generated homepage. Get started by editing src/routing/home/index.ts.')
  );
}
`;
  await fs.writeFile(path.join(targetDir, 'src', 'routing', 'home', 'index.ts'), homeRouterContent);

  const homeConfigContent = `export default {
  path: '/',
  title: 'Home',
  window: {
    width: 1200,
    height: 800,
    title: 'Home',
  },
  layout: 'default',
  requireAuth: false,
};
`;
  await fs.writeFile(path.join(targetDir, 'src', 'routing', 'home', 'system_configuration.ts'), homeConfigContent);

  // Create a clean package.json for the new project
  const packageJson = {
    name: projectName,
    private: true,
    version: '0.0.0',
    type: 'module',
    main: 'dist/electron/main.cjs',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
    },
    devDependencies: {
      '@types/fs-extra': '^11.0.4',
      '@types/node': '^26.2.0',
      electron: '^43.4.1',
      typescript: '~6.0.2',
      vite: '^8.2.0',
    },
    dependencies: {
      'rebuilder-framework-cli': 'latest',
      '@tailwindcss/vite': '^4.3.3',
      chalk: '^6.0.0',
      clsx: '^2.1.1',
      'fs-extra': '^11.4.0',
      path: '^0.12.7',
      'tailwind-merge': '^3.6.0',
      tailwindcss: '^4.3.3',
      'vite-plugin-electron': '^1.1.1',
      'vite-plugin-electron-renderer': '^1.0.0',
    },
  };

  await fs.writeJson(path.join(targetDir, 'package.json'), packageJson, { spaces: 2 });

  console.log(chalk.green(`\n✅ Project ${projectName} created successfully!\n`));
  console.log('Next steps:');
  console.log(chalk.cyan(`  cd ${projectName}`));
  console.log(chalk.cyan(`  npm install`));
  console.log(chalk.cyan(`  npm run dev`));
}

