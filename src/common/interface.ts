import * as constants from "./constants";

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
  timestamp: number;
}

export interface ISignedPbk {
  uids: string[];
  pbk: number;
}
