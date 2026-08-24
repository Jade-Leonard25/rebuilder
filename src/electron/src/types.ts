export interface WindowConfig {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  title?: string;
  icon?: string;
  frame?: boolean;
  resizable?: boolean;
  movable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  closable?: boolean;
  focusable?: boolean;
  alwaysOnTop?: boolean;
  fullscreen?: boolean;
  fullscreenable?: boolean;
  transparent?: boolean;
  backgroundColor?: string;
  opacity?: number;
  show?: boolean;
  center?: boolean;
  x?: number;
  y?: number;
}

export interface MenuItemConfig {
  label?: string;
  role?: any;
  accelerator?: string;
  submenu?: MenuItemConfig[];
  click?: string;
}

export interface MenuConfig {
  show?: boolean;
  items?: MenuItemConfig[];
}

export interface TrayConfig {
  show?: boolean;
  icon?: string;
  tooltip?: string;
  menu?: MenuItemConfig[];
}

export interface IPCConfig {
  channels?: string[];
}

export interface DialogConfig {
  defaultPath?: string;
  filters?: Electron.FileFilter[];
}

export interface RebuilderConfig {
  window?: WindowConfig;
  menu?: MenuConfig;
  tray?: TrayConfig;
  shortcuts?: Record<string, string>;
  ipc?: IPCConfig;
  dialog?: DialogConfig;
  path?: string;
  title?: string;
  layout?: string;
  requireAuth?: boolean;
  transition?: string;
  duration?: number;
}

