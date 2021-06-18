import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ipcRenderer } from "electron";
import * as constants from "@/common/constants";

export function useMessageSender() {
  const sender = useCallback(
    (key: string | constants.ChannelType, ...args) => {
      ipcRenderer.send(key, ...args);
    },
    [ipcRenderer]
  );
  return sender;
}

export function useMessageListener(
  key: string | string[] | constants.ChannelType | constants.ChannelType[],
  callback: (...args: any[]) => void,
  deps: any[]
) {
  useEffect(() => {
    if (Array.isArray(key)) {
      key.forEach((one) => {
        ipcRenderer.on(one, (evt, ...rest) => {
          callback(...rest);
        });
      });
    } else {
      ipcRenderer.on(key, (evt, ...rest) => {
        callback(...rest);
      });
    }
    return () => {
      if (Array.isArray(key)) {
        key.forEach((one) => {
          ipcRenderer.off(one, (evt, ...rest) => {
            callback(...rest);
          });
        });
      } else {
        ipcRenderer.off(key, (evt, ...rest) => {
          callback(...rest);
        });
      }
    };
  }, [...deps]);
}

const messageStore = new Map();

export function useMessageValue<T extends any>(key: constants.ChannelType): T {
  const [value, setValue] = useState<T | null>(messageStore.get(key));
  useEffect(() => {
    const callback = (_evt, nextValue) => {
      messageStore.set(key, nextValue);
      setValue(nextValue);
    };
    ipcRenderer.on(key, callback);
    return () => {
      ipcRenderer.off(key, callback);
    };
  }, [key, setValue]);
  return value as T;
}
