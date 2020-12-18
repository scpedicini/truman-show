// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const path = require('path')
const fs = require('fs');

let mainWindow;
let appSettings;

function getSettings() {
    // settings override environment variable

    let settings = require('./js/appsettings');

    // dev = home directory, prod = user data path (roaming/truman-show)
    let basepath = settings.DEV_ENV ? app.getAppPath() : app.getPath('userData');
    let settingsfile = path.join(basepath, 'appsettings.json');

    try {
        if (fs.existsSync(settingsfile))
            settings = {...settings, ...JSON.parse(fs.readFileSync(settingsfile, 'utf8' ))};
    } catch(e) {
        console.error(e);
    }

    return settings;
}



function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            devTools: appSettings.DEV_ENV ?? false, // can't bring them up even with the menu bar
        },
        transparent: true,
        frame: false,

    })

    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
        mainWindow.focus();
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    if(appSettings.DEV_ENV)
        mainWindow.webContents.openDevTools();

}

ipcMain.handle('settings', args => {
    return appSettings;
});

ipcMain.on('close', function() {
    app.quit();
});

//app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('enable-transparent-visuals');
// app.commandLine.appendSwitch('disable-gpu');

appSettings = getSettings();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {

    //setTimeout(() => createWindow(), 5000);

    createWindow();

    // globalShortcut.register('Ctrl+Alt+H', () => {
    //     console.log("global shortcut");
    //     mainWindow.focus();
    // });


    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
