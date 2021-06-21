import React, { useCallback, useEffect, useState } from "react";
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

const messageStore = new Map<
  string,
  { value: any; cbs: ((value: any) => void)[] }
>();

export function useMessageValue<T extends any>(
  key: constants.ChannelType,
  defaultValue: T
): T {
  const [value, setValue] = useState<T>(
    messageStore.get(key)?.value ?? defaultValue
  );
  useEffect(() => {
    let target = messageStore.get(key);
    const callback = (_evt, nextValue) => {
      const storeItem = messageStore.get(key);
      if (storeItem) {
        storeItem.value = nextValue;
        storeItem.cbs.forEach((one) => one(nextValue));
      }
    };
    if (!target) {
      target = {
        value: null,
        cbs: [],
      };
      ipcRenderer.on(key, callback);
    }
    target.cbs.push(setValue);
    messageStore.set(key, target);
    return () => {
      const index = target?.cbs.findIndex((one) => one === setValue);
      if (index && index !== -1) {
        target?.cbs.splice(index, 1);
        if (target?.cbs.length === 0) {
          ipcRenderer.off(key, callback);
        }
      }
    };
  }, [key, setValue]);
  return value;
}
