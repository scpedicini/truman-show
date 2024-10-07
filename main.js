// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const fs = require('fs');

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

//app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-transparent-visuals');
// app.commandLine.appendSwitch('disable-gpu');



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {

    //setTimeout(() => createWindow(), 5000);

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
