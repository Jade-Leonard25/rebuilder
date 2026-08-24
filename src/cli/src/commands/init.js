import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function initProject(projectName) {
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
    // Files and folders to copy from the framework
    const itemsToCopy = [
        'src',
        'ui',
        'vite.config.ts',
        'tsconfig.json',
        'index.html',
        'global.d.ts',
    ];
    for (const item of itemsToCopy) {
        const srcPath = path.join(packageRoot, item);
        const destPath = path.join(targetDir, item);
        if (fs.existsSync(srcPath)) {
            if (item === 'src') {
                // Copy everything in src EXCEPT the cli folder
                await fs.copy(srcPath, destPath, {
                    filter: (src) => !src.includes(path.join('src', 'cli')),
                });
            }
            else {
                await fs.copy(srcPath, destPath);
            }
        }
    }
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
