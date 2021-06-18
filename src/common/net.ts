import * as net from "net";
import { ServerBroadcastStream } from "@/lib/stream/serverBroadcast";

export function createServer() {
  const broadcastStream = new ServerBroadcastStream();
  const srv = net.createServer((socket) => {
    broadcastStream.emit("joinNewClient", socket);
    broadcastStream.addSocket(socket);
    socket.on("end", () => {
      broadcastStream.removeSocket(socket);
    });
  });
  srv.listen({ port: 0, host: "0.0.0.0" }, () => {
    broadcastStream.emit("startServer");
  });

  return {
    srv,
    broadcastStream,
  };
}

export function createConnection({
  port,
  host,
}: {
  port: number;
  host: string;
}) {
  const conn = net.createConnection({ port, host });
  conn.on("end", () => {
    conn.destroy();
    conn.unref();
  });
  return { connection: conn };
}
