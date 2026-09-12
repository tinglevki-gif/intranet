const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('licenseApi', {
  getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
  getTrialStatus: () => ipcRenderer.invoke('get-trial-status'),
  copyHardwareId: (hwId) => ipcRenderer.invoke('copy-hardware-id', hwId)
});
