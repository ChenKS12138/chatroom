import { ChannelType } from "@/common/constants";
import { ipcRenderer } from "electron";
import React, { useCallback } from "react";
import { useMessageSender } from "./messageHook";

export function useCrypto() {
  const encrypt = useCallback((secret: string, msg: string) => {
    return ipcRenderer.sendSync(ChannelType.AES_ENCRYPT_CALL, secret, msg);
  }, []);

  const decrypt = useCallback((secret: string, enc: string) => {
    return ipcRenderer.sendSync(ChannelType.AES_DECRYPT_CALL, secret, enc);
  }, []);
  return {
    encrypt,
    decrypt,
  };
}
