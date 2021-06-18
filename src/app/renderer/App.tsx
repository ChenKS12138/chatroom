import React, { useCallback, useMemo, useState } from "react";
import * as constants from "@/common/constants";
import { useMessageSender, useMessageListener } from "@/app/renderer/hooks";
import { AddressInfo } from "net";
import { Chatter, IChatterRecord } from "./components";
import { MessageKind } from "@/common/constants";
import { useRpcCall, useRpcRspListener } from "./hooks/rpcHook";
import { IChatText } from "@/common/interface";
import { ChatterRecordType } from "./components/Chatter/Chatter";
import { useMessageValue } from "./hooks/messageHook";
import { useCrypto } from "./hooks/cryptoHook";

export default function App() {
  const [isWorking, setIsWorking] = useState(false);
  const [isServer, setIsServer] = useState(false);
  const [records, setRecords] = useState<IChatterRecord[]>([]);
  const [disableChatter, setDisableChatter] = useState(false);
  const uid = useMessageValue(constants.ChannelType.UPDATE_UID);
  const pbk = useMessageValue<string>(constants.ChannelType.UPDATE_PBK);
  const { encrypt } = useCrypto();

  const rpcCall = useRpcCall();

  useRpcRspListener(
    MessageKind.DEMAND_STATUS_CHAT,
    () => {
      setDisableChatter(false);
    },
    [setDisableChatter]
  );

  useRpcRspListener(
    MessageKind.DEMAND_STATUS_PBK,
    () => {
      setDisableChatter(true);
    },
    [setDisableChatter]
  );

  useRpcRspListener(
    MessageKind.BROADCAST_TEXT,
    (chatText: IChatText) => {
      setRecords((records) => {
        return [
          ...records,
          {
            ...chatText,
            type: ChatterRecordType.MESSAGE,
          },
        ];
      });
    },
    [setRecords]
  );

  useMessageListener(
    constants.ChannelType.CLIENT_ON_SERVER_CONNECTED,
    () => {
      setIsWorking(true);
      setIsServer(false);
    },
    [setIsServer, setIsWorking]
  );

  useMessageListener(
    constants.ChannelType.SERVER_ON_SERVE_START,
    () => {
      setIsWorking(true);
      setIsServer(true);
    },
    [setIsServer, setIsWorking]
  );

  useMessageListener(
    [
      constants.ChannelType.CLIENT_ON_SERVER_DISCONNECTED,
      constants.ChannelType.SERVER_ON_SERVE_STOP,
    ],
    () => {
      setIsWorking(false);
    },
    [setIsWorking]
  );

  useMessageListener(
    constants.ChannelType.LOG,
    (message) => {
      setRecords((records) => {
        return [
          ...records,
          {
            text: message,
            type: ChatterRecordType.LOG,
          },
        ];
      });
    },
    [setRecords]
  );

  const handleRequestNegotiatePbk = useCallback(() => {
    rpcCall(MessageKind.DEMAND_STATUS_PBK);
  }, [rpcCall]);

  const handleSendText = useCallback(
    (text: string, needEncrypt: boolean) => {
      if (needEncrypt) {
        text = encrypt(pbk, text);
      }
      rpcCall(MessageKind.BROADCAST_TEXT, {
        uid: uid,
        text,
        encrypted: needEncrypt,
      });
    },
    [rpcCall, uid, pbk]
  );

  return (
    <div>
      <ConnectionStatus isWorking={isWorking} />
      <ServerControl isWorking={isWorking} isServer={isServer} />
      <ClientControl isWorking={isWorking} isServer={isServer} />
      <Chatter
        onRequestNegotiatePbk={handleRequestNegotiatePbk}
        records={records}
        onSendText={handleSendText}
        disabled={!isWorking || disableChatter}
        enableEncrypt={!!pbk?.length}
      />
      <div className="uid">uid: {uid}</div>
    </div>
  );
}

interface IConnectionStatus {
  isWorking: boolean;
}

function ConnectionStatus({ isWorking }: IConnectionStatus) {
  const connectionStatus = useMemo(() => {
    return isWorking
      ? constants.ConnectionStatus.ACTIVE
      : constants.ConnectionStatus.INACTIVE;
  }, [isWorking]);
  const [localAddress, setLocalAddress] = useState("");

  useMessageListener(
    constants.ChannelType.SERVER_ON_SERVE_START,
    (address: AddressInfo) => {
      setLocalAddress(
        address.family + " " + address.address + ":" + address.port
      );
    },
    [setLocalAddress]
  );

  useMessageListener(
    constants.ChannelType.SERVER_ON_SERVE_STOP,
    () => {
      setLocalAddress("");
    },
    [setLocalAddress]
  );

  return (
    <div className="box status">
      <div data-status={connectionStatus} className="status-light" />
      <div>{localAddress}</div>
    </div>
  );
}

interface IServerControl {
  isWorking: boolean;
  isServer: boolean;
}

function ServerControl({ isWorking, isServer }: IServerControl) {
  const messageSender = useMessageSender();

  const handleClickServerStart = useCallback(() => {
    messageSender(constants.ChannelType.SERVER_START);
  }, [messageSender]);

  const handleClickServerStop = useCallback(() => {
    messageSender(constants.ChannelType.SERVER_STOP);
  }, [messageSender]);

  return (
    <div className="box box_server-controll">
      <button disabled={isWorking} onClick={handleClickServerStart}>
        start server
      </button>
      <button
        disabled={!(isWorking && isServer)}
        onClick={handleClickServerStop}
      >
        stop server
      </button>
    </div>
  );
}

interface IClientControl {
  isWorking: boolean;
  isServer: boolean;
}

function ClientControl({ isServer, isWorking }: IClientControl) {
  const [addr, setAddr] = useState("");
  const messageSend = useMessageSender();

  const handleAddrInput = useCallback(
    (event) => {
      setAddr(event.target.value);
    },
    [setAddr]
  );

  const handleClickClientStart = useCallback(() => {
    const [host, port] = addr.split(":");
    messageSend(constants.ChannelType.CLIENT_START_CONNECT, { host, port });
  }, [messageSend, addr]);

  const handleClickClientStop = useCallback(() => {
    messageSend(constants.ChannelType.CLIENT_STOP_CONNECT);
  }, [messageSend]);

  return (
    <div className="box box_client-controll">
      <input
        disabled={isWorking}
        type="text"
        value={addr}
        onInput={handleAddrInput}
      />
      <button disabled={isWorking} onClick={handleClickClientStart}>
        connect to server
      </button>
      <button
        disabled={!(isWorking && !isServer)}
        onClick={handleClickClientStop}
      >
        disconnect to server
      </button>
    </div>
  );
}
