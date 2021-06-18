import { MessageKind } from "@/common/constants";
import { IRoomUsers, ISignedPbk } from "@/common/interface";
import {
  generateG,
  generatePrime,
  generatePrivateKey,
  quickMod,
} from "@/lib/diffie-hellman/diffie-hellman";
import { RpcEventDispatcher } from "@/lib/stream/rpc";
import * as proto from "@/proto";
import electron from "electron";

export default class ClientRpcDispatcher extends RpcEventDispatcher {
  uids: string[];
  constructor(webContents, ipcMain: Electron.IpcMain = electron.ipcMain) {
    super(webContents, ipcMain);
    this.uids = [];
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
    if (kind === MessageKind.BROADCAST_USERS) {
      return this.decodeProto(proto.RoomUsers, chunk);
    }
    return Buffer.from(chunk).toString("utf8");
  }
  onDispatchCall(kind: MessageKind, ...args): [MessageKind, ...any[]] {
    if (kind === MessageKind.DEMAND_STATUS_PBK) {
      this.dispatchRsp(MessageKind.DEMAND_STATUS_PBK);
      this.updatePrivateKey();
      process.nextTick(() => {
        this.negotiatePbk(this.uids);
      });
    }
    return [kind, ...args];
  }
  onDispatchRsp(kind: MessageKind, ...args): [MessageKind, ...any[]] {
    if (kind === MessageKind.BROADCAST_LOG) {
      this.log(Buffer.from(args[0]).toString("utf8"));
    } else if (kind === MessageKind.BROADCAST_USERS) {
      const roomUsers: IRoomUsers = args[0];
      this.uids = roomUsers.users.map((one) => one.uid);
    } else if (kind === MessageKind.DEMAND_STATUS_PBK) {
      this.updatePrivateKey();
      process.nextTick(() => {
        this.negotiatePbk(this.uids);
      });
    } else if (kind === MessageKind.SIGN_PBK) {
      const signedPbk: ISignedPbk = args[0];
      this.negotiatePbk(this.uids, signedPbk.pbk, signedPbk.uids);
    }
    return [kind, ...args];
  }
}
