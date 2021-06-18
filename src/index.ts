import { app, BrowserWindow } from "electron";
import { runApp } from "@/app/main";

import * as path from "path";

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
    minWidth: 800,
    minHeight: 700,
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  runApp(mainWindow);
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
