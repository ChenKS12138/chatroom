import { BrowserWindow, app, ipcMain } from "electron";
import * as stream from "stream";
import * as constants from "@/common/constants";
import { createConnection } from "@/common/net";
import {
  CompressStream,
  DecompressStream,
  SizePrefixedChunkDecodeStream,
  SizePrefixedChunkEncodeStream,
  UpdateMessageDecodeStream,
  UpdateMessageEncodeStream,
} from "@/lib/stream";
import { RpcStream } from "@/lib/stream/rpc";
import ClientRpcDispatcher from "./clientRpcDispatcher";

export function runClientApp(mainWindow: BrowserWindow) {
  ipcMain.on(
    constants.ChannelType.CLIENT_START_CONNECT,
    (_evt, { port, host } = {}) => {
      const { connection } = createConnection({
        port,
        host,
      });

      const rpcEventDispatcher = new ClientRpcDispatcher(
        mainWindow.webContents,
        ipcMain
      );
      const rpcStream = new RpcStream(rpcEventDispatcher);

      let heartbeatTimer;
      connection.on("connect", () => {
        mainWindow.webContents.send(
          constants.ChannelType.CLIENT_ON_SERVER_CONNECTED
        );
        heartbeatTimer = setInterval(() => {
          rpcEventDispatcher.dispatchCall(
            constants.MessageKind.HEARTBEAT,
            rpcEventDispatcher.uid
          );
        }, 1000);
      });

      connection.on("close", () => {
        mainWindow.webContents.send(
          constants.ChannelType.CLIENT_ON_SERVER_DISCONNECTED
        );
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        connection.destroy();
      });

      app.once("window-all-closed", () => {
        connection.end();
      });

      ipcMain.on(constants.ChannelType.CLIENT_STOP_CONNECT, () => {
        connection.end();
      });

      // Pipe Msg, Server -> Client
      stream.pipeline(
        connection,
        new SizePrefixedChunkDecodeStream(),
        new DecompressStream(),
        new UpdateMessageDecodeStream(),
        rpcStream,
        () => {}
      );

      // Pipe Msg, Client -> Server
      stream.pipeline(
        rpcStream,
        new UpdateMessageEncodeStream(),
        new CompressStream(),
        new SizePrefixedChunkEncodeStream(),
        connection,
        () => {}
      );
    }
  );
}
