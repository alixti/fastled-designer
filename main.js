// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    frame: false,
    webPreferences: {
      //preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  mainWindow.setMenu(null);

  mainWindow.maximize();

  // and load the index.html of the app.
  mainWindow.loadURL(path.join(__dirname, 'src/index.html'))

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});