import * as stream from "stream";
import * as assert from "assert";
import {
  DecompressStream,
  CompressStream,
  SizePrefixedChunkEncodeStream,
  SizePrefixedChunkDecodeStream,
  numToBuffer,
  bufferToNum,
} from "../index";

describe("number2buffer & buffer2number", () => {
  it("should convert well", (done) => {
    const testcases = [0, 255, 960000, 1, 100, 1000];
    for (const num of testcases) {
      assert.strictEqual(bufferToNum(numToBuffer(num)), num);
    }
    done();
  });
});

describe("compress stream", () => {
  it("should zip and unzip", (done) => {
    const texts = ["hello", "", "world", "asdfnkl;asdfj13123414234"];
    const iter = texts[Symbol.iterator]();
    stream.pipeline(
      new stream.Readable({
        read() {
          const curr = iter.next();
          this.push(curr.done ? null : curr.value);
        },
      }),
      new CompressStream(),
      new DecompressStream(),
      new stream.Writable({
        write(chunk, enc, callback) {
          assert.strictEqual(texts.includes(chunk.toString()), true);
          callback();
        },
      }),
      (err) => {
        assert.strictEqual(err, undefined);
        done();
      }
    );
  });
});

describe("sized chunk", () => {
  it("should prefix chunk", (done) => {
    const text = "hellohello";
    const data = Buffer.from(text);
    stream.pipeline(
      new stream.Readable({
        read() {
          this.push(data);
          this.push(null);
        },
      }),
      new SizePrefixedChunkEncodeStream(),
      new stream.Transform({
        transform(chunk, enc, callback) {
          chunk = Buffer.from(chunk);
          for (const item of chunk) {
            this.push(Buffer.from([item]), enc);
          }
          callback();
        },
      }),
      new SizePrefixedChunkDecodeStream(),
      new stream.Writable({
        write(chunk, enc, callback) {
          assert.strictEqual(chunk.toString(), text);
          callback();
        },
      }),
      (err) => {
        if (err) {
          console.error(err);
        }
        assert.strictEqual(err, undefined);
        done();
      }
    );
  });
});
