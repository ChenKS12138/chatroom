import { ChannelType, MessageKind } from "@/common/constants";
import { ISignedPbk, IRoomUser, IUpdateMessage } from "@/common/interface";
import { UidList } from "@/common/util";
import { RpcEventDispatcher } from "@/lib/stream/rpc";
import * as proto from "@/proto";
import electron from "electron";

export default class PeerRpcDispatcher extends RpcEventDispatcher {
  uidList: UidList;
  constructor(webContents, ipcMain: Electron.IpcMain = electron.ipcMain) {
    super(webContents, ipcMain);
    this.uidList = new UidList(this.uid, 10000);
    this.pbkInfo = null;
  }
  encodeRpcUpdateMessageChunk(kind: MessageKind, ...args: any): Buffer {
    if (kind === MessageKind.BROADCAST_TEXT) {
      return this.encodeProto(proto.ChatText, args[0]);
    }
    if (kind === MessageKind.SIGN_PBK) {
      return this.encodeProto(proto.SignedPbk, args[0]);
    }
    return Buffer.from(args[0]);
  }
  decodeRpcUpdateMessageChunk(kind: MessageKind, chunk: Buffer): any {
    if (kind === MessageKind.BROADCAST_TEXT) {
      return this.decodeProto(proto.ChatText, chunk);
    }
    if (kind === MessageKind.SIGN_PBK) {
      return this.decodeProto(proto.SignedPbk, chunk);
    }
    return Buffer.from(chunk).toString("utf8");
  }
  onDispatchCall(kind: MessageKind, chunk: Buffer): [MessageKind, ...any[]] {
    switch (kind) {
      case MessageKind.BROADCAST_TEXT:
        this.dispatchRsp(MessageKind.BROADCAST_TEXT, chunk);
        break;
      case MessageKind.DEMAND_STATUS_PBK:
        this.updatePrivateKey();
        process.nextTick(() => {
          this.negotiatePbk(this.uidList.uids);
        });
        this.dispatchRsp(MessageKind.DEMAND_STATUS_PBK);
        break;
    }
    return [kind, chunk];
  }
  onDispatchRsp(kind: MessageKind, chunk: any): [MessageKind, ...any[]] {
    switch (kind) {
      case MessageKind.BROADCAST_LOG:
        this.log(Buffer.from(chunk).toString("utf8"));
        break;
      case MessageKind.BROADCAST_HEARTBEAT:
        this.uidList.update(chunk);
        this.sendToIpcRender(ChannelType.UPDATE_UIDS, this.uidList.uids);
        break;
      case MessageKind.DEMAND_STATUS_PBK:
        this.updatePrivateKey();
        process.nextTick(() => {
          this.negotiatePbk(this.uidList.uids);
        });
        break;
      case MessageKind.SIGN_PBK:
        const signedPbk: ISignedPbk = chunk;
        this.negotiatePbk(this.uidList.uids, signedPbk.pbk, signedPbk.uids);
        break;
    }
    return [kind, chunk];
  }
}
