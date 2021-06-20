import * as stream from "stream";
import * as events from "events";
import electron from "electron";
import { ChannelType, MessageKind } from "@/common/constants";
import { ISignedPbk, IUpdateMessage } from "@/common/interface";
import { v4 as uuidv4 } from "uuid";
import { Type } from "protobufjs";
import {
  generateG,
  generatePrime,
  generatePrivateKey,
  quickMod,
} from "../diffie-hellman/diffie-hellman";

export class RpcStream extends stream.Duplex {
  private rpcEventDispatcher: RpcEventDispatcher;
  constructor(rpcEventDispatcher: RpcEventDispatcher) {
    super({
      objectMode: true,
    });
    this.rpcEventDispatcher = rpcEventDispatcher;
    this.rpcEventDispatcher.emitter.on("data", (chunk) => {
      if (!this.push(chunk)) {
        this.rpcEventDispatcher.emitter.pause();
      }
    });
  }
  _read() {
    this.rpcEventDispatcher.emitter.resume();
  }
  _write(updateMessage: IUpdateMessage, _encoding, callback) {
    this.rpcEventDispatcher._dispatchRsp(
      updateMessage.messageKind,
      updateMessage.src,
      updateMessage?.chunk
    );
    callback();
  }
}

export abstract class RpcEventDispatcher {
  private webContents: Electron.WebContents;
  private ipcMain: Electron.IpcMain;
  uid: string;
  emitter: stream.PassThrough;
  privateKey: number;
  pbkInfo: ISignedPbk | null;
  static DISPATCH_CALL_EVENT = "dispatchCall";
  constructor(webContents, ipcMain: electron.IpcMain = electron.ipcMain) {
    this.webContents = webContents;
    this.ipcMain = ipcMain;
    this.emitter = new stream.PassThrough({
      objectMode: true,
    });
    ipcMain.on(ChannelType.RPC_CALL, (evt, messageKind, ...args) => {
      evt.returnValue = undefined;
      this.emitter.write(this.generateUpdateMessage(messageKind, ...args));
    });
    this.uid = uuidv4();
    this.sendToIpcRender(ChannelType.UPDATE_UID, this.uid);
    this.privateKey = generatePrivateKey();
    this.pbkInfo = null;
  }
  _dispatchRsp(kind: MessageKind, src: string, chunk?: Buffer) {
    this.dispatchRsp(
      ...this.onDispatchRsp(
        kind,
        src,
        chunk && this.decodeRpcUpdateMessageChunk(kind, chunk)
      )
    );
  }
  dispatchRsp(kind: MessageKind, ...args: any) {
    this.webContents.send(ChannelType.RPC_RSP, kind, ...args);
  }
  dispatchCall(kind: MessageKind, ...args: any) {
    this.emitter.write(this.generateUpdateMessage(kind, ...args));
  }
  log(message: string) {
    this.webContents.send(ChannelType.LOG, message);
  }
  broadcastLog(message: string) {
    this.log(message);
    this.dispatchCall(MessageKind.BROADCAST_LOG, message);
  }
  sendToIpcRender(channel, ...args) {
    this.webContents.send(channel, ...args);
  }
  generateUpdateMessage(messageKind, ...args): IUpdateMessage {
    const payload: IUpdateMessage = {
      uuid: uuidv4(),
      src: this.uid,
      messageKind,
    };
    if (args?.length) {
      payload.chunk = this.encodeRpcUpdateMessageChunk(messageKind, ...args);
    }
    return payload;
  }
  encodeProto(protoShape: Type, obj: any): Buffer {
    obj = protoShape.create(obj);
    return Buffer.from(protoShape.encode(obj).finish());
  }
  decodeProto<T extends any>(protoShape: Type, chunk: Buffer): T {
    return protoShape.decode(chunk) as T;
  }
  abstract encodeRpcUpdateMessageChunk(kind: MessageKind, ...args: any): Buffer;
  abstract decodeRpcUpdateMessageChunk(kind: MessageKind, chunk: Buffer): any;
  abstract onDispatchRsp(
    kind: MessageKind,
    ...args: any
  ): [MessageKind, ...any];
  abstract onDispatchCall(
    kind: MessageKind,
    ...args: any
  ): [MessageKind, ...any];
}
