import * as stream from "stream";

export class SizePrefixedChunkDecodeStream extends stream.Transform {
  private _buffer: Buffer;
  private _contentIndex: number;
  private _prefixIndex: number;
  private _prefixBuffer: Buffer;
  constructor() {
    super();
    this._buffer = Buffer.alloc(1);
    this._contentIndex = 0;
    this._prefixIndex = 0;
    this._prefixBuffer = Buffer.alloc(4);
  }
  _transform(
    chunk: any,
    enc: BufferEncoding,
    callback: stream.TransformCallback
  ) {
    const data = Buffer.from(chunk);
    let dataIndex = 0;
    while (dataIndex < data.length) {
      if (this._prefixIndex < 4) {
        const appendSize = Math.max(
          0,
          Math.min(4 - this._prefixIndex, data.length - dataIndex)
        );
        data.copy(
          this._prefixBuffer,
          this._prefixIndex,
          dataIndex,
          dataIndex + appendSize
        );
        dataIndex += appendSize;
        this._prefixIndex += appendSize;
      } else {
        const contentSize = bufferToNum(this._prefixBuffer);
        if (this._buffer.length < contentSize) {
          let nextContentSize = this._buffer.length;
          while (nextContentSize < contentSize) {
            if (nextContentSize < 1024) {
              nextContentSize *= 2;
            } else {
              nextContentSize *= 1.25;
            }
          }
          const oldBuffer = this._buffer;
          this._buffer = Buffer.alloc(nextContentSize);
          oldBuffer.copy(this._buffer, 0, 0, oldBuffer.length);
        }
        const appendSize = Math.max(
          0,
          Math.min(contentSize - this._contentIndex, data.length - dataIndex)
        );
        data.copy(
          this._buffer,
          this._contentIndex,
          dataIndex,
          dataIndex + appendSize
        );
        this._contentIndex += appendSize;
        dataIndex += appendSize;
        if (this._contentIndex >= contentSize) {
          const result = Buffer.alloc(contentSize);
          this._buffer.copy(result, 0, 0, contentSize);
          this.push(result, enc);
          this._contentIndex = 0;
          this._prefixIndex = 0;
        }
      }
    }
    callback();
  }
}

export function bufferToNum(buf: Buffer): number {
  return (buf[0] << 24) + (buf[1] << 16) + (buf[2] << 8) + buf[3];
}

export class SizePrefixedChunkEncodeStream extends stream.Transform {
  constructor() {
    super();
  }
  _transform(
    chunk: any,
    enc: BufferEncoding | undefined,
    callback: stream.TransformCallback
  ) {
    this.push(Buffer.concat([numToBuffer(chunk.length), chunk]), enc);
    callback();
  }
}

export function numToBuffer(num: number): Buffer {
  return Buffer.from([
    (num >> 24) & 255,
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
  ]);
}
