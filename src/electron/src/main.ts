// src/electron/src/main.ts
import { app, BrowserWindow, Menu, Tray, ipcMain, dialog, globalShortcut, shell, nativeImage, type MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './config-bridge';
import type { RebuilderConfig, MenuItemConfig } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ElectronApp {
  private config: RebuilderConfig;
  private mainWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;
  
  constructor() {
    this.config = loadConfig();
  }
  
  init(): void {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();
      this.setupTray();
      this.setupShortcuts();
      this.setupIPC();
      this.setupAppLifecycle();
    });
  }
  
  private createWindow(): void {
    const { window: winConfig } = this.config;
    
    this.mainWindow = new BrowserWindow({
      width: winConfig?.width ?? 1200,
      height: winConfig?.height ?? 800,
      minWidth: winConfig?.minWidth,
      minHeight: winConfig?.minHeight,
      maxWidth: winConfig?.maxWidth,
      maxHeight: winConfig?.maxHeight,
      title: winConfig?.title ?? 'Rebuilder',
      icon: winConfig?.icon ? path.join(process.cwd(), winConfig.icon) : undefined,
      frame: winConfig?.frame ?? true,
      resizable: winConfig?.resizable ?? true,
      movable: winConfig?.movable ?? true,
      minimizable: winConfig?.minimizable ?? true,
      maximizable: winConfig?.maximizable ?? true,
      closable: winConfig?.closable ?? true,
      focusable: winConfig?.focusable ?? true,
      alwaysOnTop: winConfig?.alwaysOnTop ?? false,
      fullscreen: winConfig?.fullscreen ?? false,
      fullscreenable: winConfig?.fullscreenable ?? true,
      transparent: winConfig?.transparent ?? false,
      backgroundColor: winConfig?.backgroundColor,
      opacity: winConfig?.opacity,
      show: winConfig?.show ?? true,
      center: winConfig?.center ?? true,
      x: winConfig?.x,
      y: winConfig?.y,
      
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    });
    
    // Load app
    if (process.env.VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      if (process.env.NODE_ENV === 'development') {
        this.mainWindow.webContents.openDevTools();
      }
    } else {
      const appIndexPath = path.join(process.cwd(), 'dist', 'index.html');
      this.mainWindow.loadFile(appIndexPath);
    }
    
    // Open external links in browser
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }
  
  private setupMenu(): void {
    const { menu } = this.config;
    
    if (!menu?.show) {
      Menu.setApplicationMenu(null);
      return;
    }
    
    if (menu?.items) {
      const template = menu.items.map((item: MenuItemConfig) => this.buildMenuItem(item));
      Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }
  }
  
  private buildMenuItem(item: MenuItemConfig): MenuItemConstructorOptions {
    const menuItem: MenuItemConstructorOptions = {};
    
    if (item.label) menuItem.label = item.label;
    if (item.role) menuItem.role = item.role;
    if (item.accelerator) menuItem.accelerator = item.accelerator;
    
    if (item.submenu) {
      menuItem.submenu = item.submenu.map((sub: MenuItemConfig) => this.buildMenuItem(sub));
    }
    
    if (item.click) {
      menuItem.click = () => {
        this.mainWindow?.webContents.send('menu:click', item.click);
      };
    }
    
    return menuItem;
  }
  
  private setupTray(): void {
    const { tray: trayConfig } = this.config;
    
    if (!trayConfig?.show || !trayConfig?.icon) return;
    
    const icon = nativeImage.createFromPath(
      path.join(process.cwd(), trayConfig.icon)
    );
    
    this.tray = new Tray(icon);
    
    if (trayConfig.tooltip) {
      this.tray.setToolTip(trayConfig.tooltip);
    }
    
    if (trayConfig.menu) {
      const contextMenu = Menu.buildFromTemplate(
        trayConfig.menu.map((item: MenuItemConfig) => this.buildMenuItem(item))
      );
      this.tray.setContextMenu(contextMenu);
    }
    
    this.tray.on('click', () => {
      this.mainWindow?.show();
    });
  }
  
  private setupShortcuts(): void {
    const { shortcuts } = this.config;
    if (!shortcuts) return;
    
    Object.entries(shortcuts).forEach(([accelerator, action]) => {
      globalShortcut.register(accelerator, () => {
        this.mainWindow?.webContents.send('shortcut', action);
      });
    });
  }
  
  private setupIPC(): void {
    const { ipc } = this.config;
    
    if (ipc?.channels) {
      ipc.channels.forEach((channel: string) => {
        ipcMain.handle(channel, async (_event, ...args: any[]) => {
          // Send to renderer
          this.mainWindow?.webContents.send(channel, ...args);
        });
      });
    }
    
    // Window controls
    ipcMain.handle('window:minimize', () => this.mainWindow?.minimize());
    ipcMain.handle('window:maximize', () => this.mainWindow?.maximize());
    ipcMain.handle('window:close', () => this.mainWindow?.close());
    ipcMain.handle('window:fullscreen', () => this.mainWindow?.setFullScreen(!this.mainWindow?.isFullScreen()));
    
    // Dialog
    ipcMain.handle('dialog:open', async () => {
      const { dialog: dialogConfig } = this.config;
      return dialog.showOpenDialog({
        defaultPath: dialogConfig?.defaultPath,
        filters: dialogConfig?.filters,
      });
    });
  }
  
  private setupAppLifecycle(): void {
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
    
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
    
    app.on('will-quit', () => {
      globalShortcut.unregisterAll();
    });
  }
}

const electronApp = new ElectronApp();
electronApp.init();

export default ElectronApp;