import * as stream from "stream";
import * as zlib from "zlib";

export class CompressStream extends stream.Transform {
  _transform(
    chunk: Buffer,
    enc: BufferEncoding,
    callback: stream.TransformCallback
  ) {
    const compressed = zlib.deflateSync(chunk);
    this.push(compressed, enc);
    callback();
  }
}

export class DecompressStream extends stream.Transform {
  _transform(
    chunk: Buffer,
    enc: BufferEncoding,
    callback: stream.TransformCallback
  ) {
    const decompressed = zlib.inflateSync(chunk);
    this.push(decompressed, enc);
    callback();
  }
}
