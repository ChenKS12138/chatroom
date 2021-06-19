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
    const { broadcastStream, srv } = createServer();

    const rpcEventDispatcher = new PeerRpcDispatcher(
      mainWindow.webContents,
      ipcMain
    );

    const rpcStream = new RpcStream(rpcEventDispatcher);

    let heartbeatTimer;
    broadcastStream.on("startServer", () => {
      mainWindow.webContents.send(
        constants.ChannelType.SERVER_ON_SERVE_START,
        srv.address()
      );
      app.once("window-all-closed", () => {
        broadcastStream.emit("stopServer");
      });
      ipcMain.once(constants.ChannelType.SERVER_STOP, () => {
        broadcastStream.emit("stopServer");
      });
      heartbeatTimer = setInterval(() => {
        rpcEventDispatcher.dispatchCall(
          constants.MessageKind.BROADCAST_HEARTBEAT,
          rpcEventDispatcher.uid
        );
      }, 500);
    });

    broadcastStream.on("stopServer", () => {
      srv.close(() => {
        srv.unref();
      });
      broadcastStream.destroy();
      broadcastStream.end();
      mainWindow.webContents.send(constants.ChannelType.SERVER_ON_SERVE_STOP);
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        rpcEventDispatcher.sendToIpcRender(
          constants.ChannelType.UPDATE_UIDS,
          []
        );
        heartbeatTimer = null;
      }
    });

    // Pipe Msg, Client -> Server
    stream.pipeline(
      broadcastStream,
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
      broadcastStream,
      () => {}
    );
  });
}
