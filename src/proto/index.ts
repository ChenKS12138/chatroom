import * as protobuf from "protobufjs";
import * as path from "path";

const root = protobuf.loadSync(path.join(__dirname, "./UpdateMessage.proto"));

export const UpdateMessage = root.lookupType("chatroompackage.UpdateMessage");

export const RoomUser = root.lookupType("chatroompackage.RoomUser");
export const RoomUsers = root.lookupType("chatroompackage.RoomUsers");
export const ChatText = root.lookupType("chatroompackage.ChatText");
export const SignedPbk = root.lookupType("chatroompackage.SignedPbk");
