import type { RebuilderConfig } from './types';
import path from 'path';
import fs from 'fs';

const defaultConfig: RebuilderConfig = {
  window: {
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    resizable: true,
    fullscreenable: true,
    title: 'Rebuilder App',
    show: true,
    center: true,
  },
  menu: {
    show: false,
    items: [],
  },
  tray: {
    show: false,
  },
  shortcuts: {},
  ipc: {
    channels: [],
  },
  dialog: {},
};

export function loadConfig(): RebuilderConfig {
  try {
    const configPath = path.join(process.cwd(), 'rebuilder.config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(content) };
    }
  } catch (error) {
    console.warn('Failed to load config, using defaults:', error);
  }
  return defaultConfig;
}

