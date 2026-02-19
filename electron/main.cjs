const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

console.log("ELECTRON MAIN PROCESS: v1.1.1 STARTED");

// Start the Express server
if (isDev) {
    (async () => {
        try {
            await import('../server/index.js');
        } catch (e) {
            console.error("Failed to start dev server:", e);
        }
    })();
} else {
    // In production, use the bundled CommonJS server
    const fs = require('fs');
    const os = require('os');
    const logFile = path.join(os.homedir(), 'youtubezilla-main.log');

    try {
        require(path.join(__dirname, '../dist-server/index.cjs'));
    } catch (e) {
        try {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Failed to start server: ${e.stack || e}\n`);
        } catch (fsErr) {
            // ignore
        }
        console.error("Failed to start server:", e);
    }
}

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple MVP
        },
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0f172a',
            symbolColor: '#ffffff',
            height: 30
        },
        backgroundColor: '#020617',
        show: false // Don't show until ready
    });

    // Load the app
    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../dist/index.html')}`;

    console.log('Loading URL:', startUrl);
    mainWindow.loadURL(startUrl);

    // Show when ready to avoid white flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Minimize to tray behavior
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });

    if (isDev) {
        // mainWindow.webContents.openDevTools();
    }
}

function createTray() {
    // We need an icon. For now, we'll generate a simple one or use a placeholder.
    // Ideally we load 'icon.ico'
    const iconPath = path.join(__dirname, '../public/vite.svg'); // Temporary icon
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow.show() },
        {
            label: 'Quit', click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('YoutubeZilla');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
