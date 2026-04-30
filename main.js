// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, net, clipboard} = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');

const gifTempDir = path.join(os.tmpdir(), 'truman-show-gifs');
const trackedTempFiles = new Set();
const MAX_GIF_BYTES = 25 * 1024 * 1024;
const STALE_TEMP_MS = 24 * 60 * 60 * 1000;

let mainWindow;
let appSettings;
let settingsFile;


let baseSettings = require('./js/appsettings');

// dev = home directory, prod = user data path (roaming/truman-show)
let basePath = baseSettings.DEV_ENV ? app.getAppPath() : app.getPath('userData');
settingsFile = path.join(basePath, 'appsettings.json');

appSettings = {...baseSettings};

// settings override environment variable
try {
    if (fs.existsSync(settingsFile)) {
        appSettings = {...appSettings, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8'))};
    }
} catch(e) {
    console.error(e);
}



async function createWindow() {
    // Create the browser window.
    let options = {
        width: appSettings.BOUNDS?.width ?? 1440,
        height: appSettings.BOUNDS?.height ?? 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: appSettings.DEV_ENV ?? false, // can't bring them up even with the menu bar
            contextIsolation: false,
            nodeIntegration: false,
        },
        transparent: true,
        frame: false,
    };

    // if('x' in appSettings.BOUNDS)
    //     options.x = appSettings.BOUNDS.x;
    // if('y' in appSettings.BOUNDS)
    //     options.y = appSettings.BOUNDS.y;

    mainWindow = new BrowserWindow(options);

    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
        mainWindow.focus();

    });

    const passedArgs = process.argv.slice(2).join(' ').trim();


    // and load the index.html of the app.
    await mainWindow.loadFile('index.html', { query: { 'searchString': passedArgs } });

    if(appSettings.DEV_ENV)
        mainWindow.webContents.openDevTools();

}

ipcMain.on('save-settings', (event, data)  => {
    appSettings = {...appSettings, ...data};
    fs.writeFileSync(settingsFile, JSON.stringify(appSettings), 'utf8');
});

ipcMain.handle('load-settings', (_event, ..._args) => {
    return appSettings;
});

ipcMain.on('close', function() {

    appSettings.BOUNDS = mainWindow.getBounds();
    fs.writeFileSync(settingsFile, JSON.stringify(appSettings), 'utf8');

    app.quit();
});

function setupGifTempDir() {
    try {
        fs.mkdirSync(gifTempDir, { recursive: true });
    } catch (e) {
        console.error('Failed to create gif temp dir', e);
        return;
    }
    try {
        const now = Date.now();
        for (const name of fs.readdirSync(gifTempDir)) {
            const p = path.join(gifTempDir, name);
            try {
                const st = fs.statSync(p);
                if (now - st.mtimeMs > STALE_TEMP_MS) fs.unlinkSync(p);
            } catch (_) {}
        }
    } catch (e) {
        console.error('Failed to sweep stale gif temp files', e);
    }
}

function downloadToFile(url, targetPath) {
    return new Promise((resolve, reject) => {
        const request = net.request({ url, redirect: 'follow' });
        let bytes = 0;
        let aborted = false;
        request.on('response', (response) => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                aborted = true;
                request.abort();
                return reject(new Error(`HTTP ${response.statusCode}`));
            }
            const out = fs.createWriteStream(targetPath);
            response.on('data', (chunk) => {
                if (aborted) return;
                bytes += chunk.length;
                if (bytes > MAX_GIF_BYTES) {
                    aborted = true;
                    request.abort();
                    out.destroy();
                    try { fs.unlinkSync(targetPath); } catch (_) {}
                    return reject(new Error(`GIF exceeds ${MAX_GIF_BYTES} bytes`));
                }
                out.write(chunk);
            });
            response.on('end', () => {
                if (aborted) return;
                out.end(() => resolve());
            });
            response.on('error', (err) => {
                if (aborted) return;
                aborted = true;
                out.destroy();
                try { fs.unlinkSync(targetPath); } catch (_) {}
                reject(err);
            });
        });
        request.on('error', reject);
        request.end();
    });
}

function setMacClipboardToFile(targetPath) {
    return new Promise((resolve, reject) => {
        execFile(
            'osascript',
            ['-e', 'set the clipboard to (POSIX file (system attribute "TS_GIF_PATH"))'],
            { env: { ...process.env, TS_GIF_PATH: targetPath } },
            (err, stdout, stderr) => {
                if (err) return reject(new Error(stderr || err.message));
                resolve();
            }
        );
    });
}

ipcMain.handle('clipboard:copy-gif-from-url', async (_evt, { url }) => {
    try {
        if (typeof url !== 'string' || !url) throw new Error('Missing url');
        const hash = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
        const targetPath = path.join(gifTempDir, `${hash}.gif`);
        if (!fs.existsSync(targetPath)) {
            await downloadToFile(url, targetPath);
        }
        trackedTempFiles.add(targetPath);
        await setMacClipboardToFile(targetPath);
        return { ok: true, path: targetPath };
    } catch (e) {
        console.error('copy-gif-from-url failed', e);
        return { ok: false, error: e.message };
    }
});

ipcMain.handle('clipboard:copy-text', async (_evt, { text }) => {
    try {
        if (typeof text !== 'string') throw new Error('Missing text');
        clipboard.writeText(text);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e.message };
    }
});

app.on('before-quit', () => {
    for (const p of trackedTempFiles) {
        try { fs.unlinkSync(p); } catch (_) {}
    }
});

//app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-transparent-visuals');
// app.commandLine.appendSwitch('disable-gpu');



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {

    //setTimeout(() => createWindow(), 5000);

    setupGifTempDir();

    await createWindow();

    // globalShortcut.register('Ctrl+Alt+H', () => {
    //     console.log("global shortcut");
    //     mainWindow.focus();
    // });


    app.on('activate', function () {
        // On macOS, it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
