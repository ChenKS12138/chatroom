import { BrowserWindow } from "electron";
import { runClientApp } from "@/app/main/runClient";
import { runServerApp } from "@/app/main/runServer";
import { runCommon } from "./runCommon";

export function runApp(mainWindow: BrowserWindow): void {
  runCommon(mainWindow);
  runServerApp(mainWindow);
  runClientApp(mainWindow);
}
