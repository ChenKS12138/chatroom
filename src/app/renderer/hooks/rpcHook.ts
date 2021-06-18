import React, { useCallback, useMemo } from "react";
import { useMessageListener, useMessageSender } from "./messageHook";
import { ChannelType, MessageKind } from "@/common/constants";

export function useRpcCall() {
  const messageSender = useMessageSender();
  const caller = useCallback((messageKind: MessageKind, ...args: any) => {
    messageSender(ChannelType.RPC_CALL, messageKind, ...args);
  }, []);
  return caller;
}

export function useRpcRspListener(
  messageKind: MessageKind,
  callback: (...args: any) => void,
  deps: any[]
) {
  useMessageListener(
    ChannelType.RPC_RSP,
    (kind, ...args) => {
      if (kind === messageKind) {
        callback(...args);
      }
    },
    deps
  );
}
