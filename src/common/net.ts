import * as net from "net";
import { BroadcastHub } from "@/lib/stream/broadcast";

export function createServer() {
  const broadcastHub = new BroadcastHub();
  const srv = net.createServer((socket) => {
    broadcastHub.serverPort.emit("addClient", socket);
    broadcastHub.addSocket(socket);
    socket.on("end", () => {
      broadcastHub.serverPort.emit("removeClient", socket);
    });
  });
  srv.listen({ port: 0, host: "0.0.0.0" }, () => {
    broadcastHub.serverPort.emit("startServer");
  });

  srv.on("close", () => {
    broadcastHub.destroy();
  });

  return {
    srv,
    serverPort: broadcastHub.serverPort,
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
