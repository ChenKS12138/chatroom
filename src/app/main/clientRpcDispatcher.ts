import { ChannelType, MessageKind } from "@/common/constants";
import { IRoomUsers, ISignedPbk } from "@/common/interface";
import { UidList } from "@/common/util";
import { RpcEventDispatcher } from "@/lib/stream/rpc";
import * as proto from "@/proto";
import electron from "electron";

export default class ClientRpcDispatcher extends RpcEventDispatcher {
  uidList: UidList;
  constructor(webContents, ipcMain: Electron.IpcMain = electron.ipcMain) {
    super(webContents, ipcMain);
    this.uidList = new UidList(this.uid, 10000);
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
  onDispatchCall(kind: MessageKind, ...args): [MessageKind, ...any[]] {
    if (kind === MessageKind.DEMAND_STATUS_PBK) {
      this.dispatchRsp(MessageKind.DEMAND_STATUS_PBK);
      this.updatePrivateKey();
      process.nextTick(() => {
        this.negotiatePbk(this.uidList.uids);
      });
    }
    return [kind, ...args];
  }
  onDispatchRsp(kind: MessageKind, ...args): [MessageKind, ...any[]] {
    if (kind === MessageKind.BROADCAST_LOG) {
      this.log(Buffer.from(args[0]).toString("utf8"));
    } else if (kind === MessageKind.BROADCAST_HEARTBEAT) {
      const uid: string = args[0];
      this.uidList.update(uid);
      this.sendToIpcRender(ChannelType.UPDATE_UIDS, this.uidList.uids);
    } else if (kind === MessageKind.DEMAND_STATUS_PBK) {
      this.updatePrivateKey();
      process.nextTick(() => {
        this.negotiatePbk(this.uidList.uids);
      });
    } else if (kind === MessageKind.SIGN_PBK) {
      const signedPbk: ISignedPbk = args[0];
      this.negotiatePbk(this.uidList.uids, signedPbk.pbk, signedPbk.uids);
    }
    return [kind, ...args];
  }
}
