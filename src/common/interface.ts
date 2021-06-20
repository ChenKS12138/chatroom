import * as constants from "./constants";
import type { Readable } from "stream";

export interface IUpdateMessage {
  uuid: string;
  src: string;
  messageKind: constants.MessageKind;
  chunk?: Buffer;
}

export interface IRoomUser {
  uid: string;
}

export interface IRoomUsers {
  users: IRoomUser[];
}

export interface IChatText {
  uid: string;
  text: string;
  encrypted: boolean;
}

export interface ISignedPbk {
  uids: string[];
  pbk: number;
}
