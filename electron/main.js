const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0b0f1a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  const isDev = !app.isPackaged;
  if (isDev) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('dialog:openFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Выберите аудиокниги',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Аудио', extensions: ['mp3','m4b','m4a','flac','wav','ogg'] }]
    });
    return canceled ? [] : filePaths;
  });

  createWindow();
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow());
});
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
