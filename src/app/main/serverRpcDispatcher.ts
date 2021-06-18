import { MessageKind } from "@/common/constants";
import { ISignedPbk, IRoomUser, IUpdateMessage } from "@/common/interface";
import { UidList } from "@/common/util";
import { RpcEventDispatcher } from "@/lib/stream/rpc";
import * as proto from "@/proto";
import electron from "electron";

export default class ServerRpcDispatcher extends RpcEventDispatcher {
  uidList: UidList;
  constructor(webContents, ipcMain: Electron.IpcMain = electron.ipcMain) {
    super(webContents, ipcMain);
    this.uidList = new UidList(this.uid, 10000);
    this.pbkInfo = null;
  }
  encodeRpcUpdateMessageChunk(kind: MessageKind, ...args: any): Buffer {
    if (kind === MessageKind.BROADCAST_USERS) {
      return this.encodeProto(proto.RoomUsers, args[0]);
    }
    if (kind === MessageKind.BROADCAST_TEXT) {
      return this.encodeProto(proto.ChatText, args[0]);
    }
    if (kind === MessageKind.SIGN_PBK) {
      return this.encodeProto(proto.SignedPbk, args[0]);
    }
    return Buffer.from(args[0]);
  }
  decodeRpcUpdateMessageChunk(kind: MessageKind, chunk: Buffer): any {
    if (kind === MessageKind.BROADCAST_USERS) {
      return this.decodeProto(proto.RoomUsers, chunk);
    }
    if (kind === MessageKind.BROADCAST_TEXT) {
      return this.decodeProto(proto.ChatText, chunk);
    }
    if (kind === MessageKind.SIGN_PBK) {
      return this.decodeProto(proto.SignedPbk, chunk);
    }
    return Buffer.from(chunk).toString("utf8");
  }
  onDispatchCall(kind: MessageKind, chunk: Buffer): [MessageKind, ...any[]] {
    if (kind === MessageKind.BROADCAST_TEXT) {
      this.dispatchRsp(MessageKind.BROADCAST_TEXT, chunk);
    } else if (kind === MessageKind.DEMAND_STATUS_PBK) {
      this.updatePrivateKey();
      process.nextTick(() => {
        this.negotiatePbk(this.uidList.uids);
      });
      this.dispatchRsp(MessageKind.DEMAND_STATUS_PBK);
    }
    return [kind, chunk];
  }
  onDispatchRsp(kind: MessageKind, chunk: any): [MessageKind, ...any[]] {
    if (kind === MessageKind.HEARTBEAT) {
      this.uidList.update(chunk);
    } else if (kind === MessageKind.DEMAND_STATUS_PBK) {
      this.updatePrivateKey();
      process.nextTick(() => {
        this.negotiatePbk(this.uidList.uids);
      });
    } else if (kind === MessageKind.SIGN_PBK) {
      const signedPbk: ISignedPbk = chunk;
      this.negotiatePbk(this.uidList.uids, signedPbk.pbk, signedPbk.uids);
    }
    return [kind, chunk];
  }
}
