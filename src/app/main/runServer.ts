import { BrowserWindow, app, ipcMain } from "electron";
import * as stream from "stream";
import * as constants from "@/common/constants";
import { createServer } from "@/common/net";
import {
  CompressStream,
  DecompressStream,
  SizePrefixedChunkDecodeStream,
  SizePrefixedChunkEncodeStream,
  UpdateMessageDecodeStream,
  UpdateMessageEncodeStream,
} from "@/lib/stream";
import PeerRpcDispatcher from "./peerRpcDispatcher";
import { RpcStream } from "@/lib/stream/rpc";

export function runServerApp(mainWindow: BrowserWindow) {
  ipcMain.on(constants.ChannelType.SERVER_START, (_evt) => {
    const { srv, serverPort } = createServer();

    const rpcEventDispatcher = new PeerRpcDispatcher(
      mainWindow.webContents,
      ipcMain
    );

    const rpcStream = new RpcStream(rpcEventDispatcher);

    serverPort.on("startServer", () => {
      mainWindow.webContents.send(
        constants.ChannelType.SERVER_ON_SERVE_START,
        srv.address()
      );
      app.once("window-all-closed", () => {
        serverPort.emit("stopServer");
      });
      ipcMain.once(constants.ChannelType.SERVER_STOP, () => {
        serverPort.emit("stopServer");
      });
      rpcEventDispatcher.startHeartbeat();
    });

    serverPort.on("addClient", () => {
      rpcEventDispatcher.updateRenderUids();
    });

    serverPort.on("removeClient", () => {
      rpcEventDispatcher.updateRenderUids();
    });

    serverPort.on("stopServer", () => {
      srv.close(() => {
        srv.unref();
      });
      serverPort.destroy();
      serverPort.end();
      mainWindow.webContents.send(constants.ChannelType.SERVER_ON_SERVE_STOP);
      rpcEventDispatcher.stopHeartbeat();
    });

    // Pipe Msg, Client -> Server
    stream.pipeline(
      serverPort,
      new SizePrefixedChunkDecodeStream(),
      new DecompressStream(),
      new UpdateMessageDecodeStream(),
      rpcStream,
      () => {}
    );

    // Pipe Msg, Server -> Client
    stream.pipeline(
      rpcStream,
      new UpdateMessageEncodeStream(),
      new CompressStream(),
      new SizePrefixedChunkEncodeStream(),
      serverPort,
      () => {}
    );
  });
}
