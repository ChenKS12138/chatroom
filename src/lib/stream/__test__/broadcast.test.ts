import * as stream from "stream";
import * as assert from "assert";

import { HubStream, createTeleports } from "../index";

describe("create teleports", () => {
  const [portA, portB] = createTeleports();
  it("should be duplex stream", (done) => {
    assert.strictEqual(portA instanceof stream.Duplex, true);
    assert.strictEqual(portB instanceof stream.Duplex, true);
    done();
  });
  it("should do teleport", (done) => {
    const s1 = new stream.PassThrough();
    const s2 = new stream.PassThrough();
    s1.pipe(portA);
    portB.pipe(s2);
    s1.write("hello");
    s2.on("data", (chunk) => {
      const text = Buffer.from(chunk).toString("utf8");
      assert.strictEqual(text, "hello");
      done();
    });
  });
});

describe("hubStream", () => {
  const hubStream = new HubStream();
  it("should be duplex stream", (done) => {
    assert.strictEqual(hubStream instanceof stream.Duplex, true);
    done();
  });
  it("should do broadcast", (done) => {
    const doneList = [false, false, false];
    const doneOne = (index) => {
      if (doneList.every((one) => one)) {
        return;
      }
      doneList[index] = true;
      if (doneList.every((one) => one)) {
        done();
      }
    };

    const s1 = new stream.PassThrough();
    const s2 = new stream.PassThrough();
    const s3 = new stream.PassThrough();

    hubStream.addPort(s1);
    hubStream.addPort(s2);
    hubStream.addPort(s3);

    s1.on("data", (chunk) => {
      const text = Buffer.from(chunk).toString("utf8");
      if (text === "hello2") {
        doneOne(0);
      }
    });

    s2.on("data", (chunk) => {
      const text = Buffer.from(chunk).toString("utf8");
      if (text === "hello2") {
        doneOne(1);
      }
    });

    s3.on("data", (chunk) => {
      const text = Buffer.from(chunk).toString("utf8");
      if (text === "hello2") {
        doneOne(2);
      }
    });

    s1.write("hello2");
  });
});
