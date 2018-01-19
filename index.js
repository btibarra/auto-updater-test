import { platform } from 'os';

const electron = require('electron');
const { app, BrowserWindow, Menu, ipcMain, dialog } = electron;
const url = require('url');
const path = require('path');
const isDev = require('electron-is-dev');
const log = require('electron-log');
const autoUpdater = require('electron-updater');


let mainWindow;
let addWindow;

checkOS = function() {
    return process.platform === 'win32';
}

sendStatusToWindow = function(text) {
    log.info(text);
    mainWindow.webContents.send('message', text);
}

autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
    sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
    sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    sendStatusToWindow(log_message);
})
    autoUpdater.on('update-downloaded', (info) => {
    sendStatusToWindow('Update downloaded');
});

// Listen for app to be ready
app.on('ready', function() {
    // Create new window
    mainWindow = new BrowserWindow({});
    // Load html into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Quit app when closed
    mainWindow.on('closed', function(){
        app.quit();
    });

    //Build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    // Insert menu
    Menu.setApplicationMenu(mainMenu);

    mainWindow.once('did-frame-finish-load', function() {
        if (checkOS && !isDev) {
          // Initate auto-updates on macOs and windows
          autoUpdater.checkForUpdatesAndNotify();
    }});
});

// Handle create add window
function createAddWindow(){
    // Create new window
    addWindow = new BrowserWindow({
        width: 300,
        height: 200,
        title: 'Add Shopping List Item'
    });
    // Load html into window
   addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol: 'file:',
        slashes: true
    }));
    // Garbage collection handle
    addWindow.on('close', function(){
        addWindow = null;
    });
}

// Catch item:add
ipcMain.on('item:add', function(e, item){
    mainWindow.webContents.send('item:add', item);
    addWindow.close();
});

// Create menu template
const mainMenuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Add item',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Clear Items',
                click(){
                    mainWindow.webContents.send('item:clear');
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// If mac, add empty object  to menu
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({});
}

// Add developers tools item if not in production
if(isDev){
    mainMenuTemplate.push({
        label: 'Developers Tools',
        submenu: [
            {
                label: 'Toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]
    });
}