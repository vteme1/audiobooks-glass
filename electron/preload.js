const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFiles: async () => ipcRenderer.invoke('dialog:openFiles'),
});
