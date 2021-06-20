import * as stream from "stream";
import type { Socket } from "net";

export class BroadcastHub {
  private hub: HubStream;
  serverPort: stream.Duplex;
  constructor() {
    this.hub = new HubStream();
    const [portA, portB] = createTeleports();
    this.hub.addPort(portA);
    this.serverPort = portB;
  }
  addSocket(socket: Socket) {
    this.hub.addPort(socket);
  }
  removeSocket(socket: Socket) {
    this.hub.removePort(socket);
    socket.unref();
  }
  destroy() {
    this.hub.destroy();
  }
}

export class HubStream extends stream.Duplex {
  ports: stream.Duplex[];
  constructor() {
    super();
    this.ports = [];
    this.pipe(this);
  }
  addPort(port: stream.Duplex) {
    port.on("data", (chunk) => {
      if (!this.push(chunk)) {
        port.pause();
      }
    });
    this.ports.push(port);
  }
  removePort(port: stream.Duplex) {
    const index = this.ports.findIndex((one) => one === port);
    if (index !== -1) {
      this.ports.splice(index, 1);
      port.destroy();
    }
  }
  _read() {
    for (let i = 0; i < this.ports.length; i++) {
      this.ports[i].resume();
    }
  }
  _write(input: Buffer, encoding: BufferEncoding, done: any) {
    let waiting = this.ports.length;
    if (waiting === 0) {
      done();
    }
    for (let i = 0; i < this.ports.length; i++) {
      this.ports[i].write(input, encoding, () => {
        waiting--;
        if (waiting === 0) {
          done();
        }
      });
    }
  }
  _destroy() {
    this.unpipe(this);
    this.ports.forEach((one) => {
      one.destroy();
    });
  }
}

export function createTeleports(): [stream.Duplex, stream.Duplex] {
  var portA: stream.Duplex, portB: stream.Duplex;
  portA = new stream.Duplex({
    read() {
      portB.resume();
    },
    write(chunk, enc, callback) {
      if (!portB.push(chunk, enc)) {
        portA.pause();
      }
      callback();
    },
  });
  portB = new stream.Duplex({
    read() {
      portA.resume();
    },
    write(chunk, enc, callback) {
      if (!portA.push(chunk, enc)) {
        portB.pause();
      }
      callback();
    },
  });
  return [portA, portB];
}
