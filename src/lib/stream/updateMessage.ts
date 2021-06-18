import * as stream from "stream";
import * as proto from "../../proto";
import { IUpdateMessage } from "@/common/interface";

export class UpdateMessageEncodeStream extends stream.Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(
    obj: IUpdateMessage,
    enc: BufferEncoding,
    callback: stream.TransformCallback
  ) {
    const updateMessage = proto.UpdateMessage.create(obj);
    this.push(proto.UpdateMessage.encode(updateMessage).finish());
    callback();
  }
}

export class UpdateMessageDecodeStream extends stream.Transform {
  constructor() {
    super({ objectMode: true });
  }
  _transform(
    chunk: Buffer,
    enc: BufferEncoding,
    callback: stream.TransformCallback
  ) {
    const updateMessage = proto.UpdateMessage.decode(chunk);
    this.push(updateMessage);
    callback();
  }
}
