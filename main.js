const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 950,
    height: 740,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true
      //   enableRemoteModule: true
    }
  });

  win.loadFile("index.html");
  // win.webContents.openDevTools();
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (win === null) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
