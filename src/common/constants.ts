export enum MessageKind {
  // 每个client发送心跳包携带uid
  BROADCAST_HEARTBEAT = 0,

  // server广播聊天室消息
  BROADCAST_TEXT = 1,
  // server广播log
  BROADCAST_LOG = 2,

  // 签发公钥
  SIGN_PBK = 3,

  // server要求client更改状态为协商密钥
  DEMAND_STATUS_PBK = 4,
  // server要求client更改状态为聊天
  DEMAND_STATUS_CHAT = 5,
}

export enum ChannelType {
  SERVER_START = "serverStart",
  SERVER_STOP = "serverStop",
  SERVER_ON_SERVE_START = "serverOnServeStart",
  SERVER_ON_SERVE_STOP = "serverOnServeStop",
  SERVER_ON_CLIENT_CONNECTED = "serverOnClientConnected",
  SERVER_ON_CLIENT_DISCONNECTED = "serverOnClientDisconnected",

  CLIENT_START_CONNECT = "clientStartConnect",
  CLIENT_STOP_CONNECT = "clientStopConnect",
  CLIENT_ON_SERVER_CONNECTED = "clientOnServerConnected",
  CLIENT_ON_SERVER_DISCONNECTED = "clientOnServerDisconnected",

  RPC_CALL = "rpcCall",
  RPC_RSP = "rpcRsp",

  AES_DECRYPT_CALL = "aesDecryptCall",
  AES_DECRYPT_RSP = "aesDecryptRsp",

  AES_ENCRYPT_CALL = "aesEncryptCall",
  AES_ENCRYPT_RSP = "aesEncryptRsp",

  LOG = "log",

  UPDATE_UID = "updateUid",
  UPDATE_PBK = "updatePbk",
  UPDATE_UIDS = "updateUids",
}

export enum ConnectionStatus {
  INACTIVE = "inactive",
  ACTIVE = "active",
}
