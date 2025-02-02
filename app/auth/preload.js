const {contextBridge, ipcRenderer} = require('electron');
function doSubmit(username,password) {

  ipcRenderer.send("authorization", {username, password})

}

// app.whenReady().then(createWindow);
contextBridge.exposeInMainWorld('authModule', {
    submit: doSubmit,
  }
)
