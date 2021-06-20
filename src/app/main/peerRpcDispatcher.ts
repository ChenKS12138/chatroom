import { ChannelType, MessageKind } from "@/common/constants";
import { ISignedPbk, IRoomUser, IUpdateMessage } from "@/common/interface";
import Long from "long";
import { UidList } from "@/common/util";
import {
  generateG,
  generatePrime,
  generatePrivateKey,
  quickMod,
} from "@/lib/diffie-hellman/diffie-hellman";
import { RpcEventDispatcher } from "@/lib/stream/rpc";
import * as proto from "@/proto";
import electron from "electron";

export default class PeerRpcDispatcher extends RpcEventDispatcher {
  uidList: UidList;
  static NEGOTIATE_PBK_TIMEOUT = 3000; // 3000ms
  private negotiateTimer: any;
  constructor(webContents, ipcMain: Electron.IpcMain = electron.ipcMain) {
    super(webContents, ipcMain);
    this.uidList = new UidList(this.uid, 1000);
    this.pbkInfo = null;
    this.uidList.emitter.on(UidList.EVENT_UID_OUTDATE, (uid) => {
      this.log(`${uid}退出了聊天室`);
    });
    this.uidList.emitter.on(UidList.EVENT_UID_NEW, (uid) => {
      this.log(`${uid}加入了聊天室`);
    });
    this.negotiateTimer = null;
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
      case MessageKind.DEMAND_STATUS_PBK:
        this.startNegotiatePbk();
        this.dispatchRsp(MessageKind.DEMAND_STATUS_PBK);
        break;
    }
    return [kind, chunk];
  }
  onDispatchRsp(
    kind: MessageKind,
    src: string,
    chunk: any
  ): [MessageKind, ...any[]] {
    switch (kind) {
      case MessageKind.BROADCAST_LOG:
        this.log(Buffer.from(chunk).toString("utf8"));
        break;
      case MessageKind.BROADCAST_HEARTBEAT:
        this.uidList.update(chunk);
        this.updateRenderUids();
        break;
      case MessageKind.DEMAND_STATUS_PBK:
        this.startNegotiatePbk();
        break;
      case MessageKind.SIGN_PBK:
        const signedPbk: ISignedPbk = chunk;
        if (src === this.uidList.leftPeer) {
          this.negotiatePbk(
            this.uidList.uids,
            Long.fromBytes(Array.from(Uint8Array.from(signedPbk.pbk)), false),
            signedPbk.uids
          );
        }
        break;
    }
    return [kind, chunk];
  }
  updateRenderUids() {
    this.sendToIpcRender(ChannelType.UPDATE_UIDS, this.uidList.uids);
  }
  startNegotiatePbk() {
    this.updatePrivateKey();
    process.nextTick(() => {
      this.pbkInfo = null;
      this.negotiatePbk(this.uidList.uids);
      if (this.negotiateTimer !== null) {
        clearTimeout(this.negotiateTimer);
      }
      this.negotiateTimer = setTimeout(() => {
        if (this.pbkInfo === null) {
          this.log(
            `协商密钥超时(${PeerRpcDispatcher.NEGOTIATE_PBK_TIMEOUT}ms)，请重试!!!`
          );
          this.dispatchCall(MessageKind.DEMAND_STATUS_CHAT);
        }
        this.negotiateTimer = null;
      }, PeerRpcDispatcher.NEGOTIATE_PBK_TIMEOUT);
    });
  }
  negotiatePbk(
    uids: string[],
    currentPbk: Long = generateG(),
    currentUids: string[] = []
  ) {
    if (currentPbk && !currentUids.includes(this.uid)) {
      currentPbk = quickMod(currentPbk, this.privateKey, generatePrime());
      currentUids.push(this.uid);
      this.log(
        `密钥协商${currentUids.length}/${uids.length}, PBK ${currentPbk}`
      );
      const pbkInfo: ISignedPbk = {
        pbk: Buffer.from(currentPbk.toBytes()),
        uids: currentUids,
      };
      if (currentUids.length < uids.length) {
        this.dispatchCall(MessageKind.SIGN_PBK, pbkInfo);
      } else {
        this.pbkInfo = pbkInfo;
        this.sendToIpcRender(
          ChannelType.UPDATE_PBK,
          Buffer.from(currentPbk.toBytes()).toString("base64")
        );
        this.log(`密钥协商结束, 请使用密钥${currentPbk}加密聊天`);
        this.dispatchCall(MessageKind.DEMAND_STATUS_CHAT);
        clearTimeout(this.negotiateTimer);
        this.negotiateTimer = null;
      }
    }
  }
  updatePrivateKey() {
    this.privateKey = generatePrivateKey();
    this.log(`请勿泄露!!!私钥为${this.privateKey}`);
  }
}
