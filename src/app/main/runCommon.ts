import { ChannelType } from "@/common/constants";
import { decrypt, encrypt } from "@/lib/diffie-hellman/crypto";
import { BrowserWindow, ipcMain } from "electron";

export function runCommon(mainWindow: BrowserWindow) {
  ipcMain.on(
    ChannelType.AES_DECRYPT_CALL,
    (evt, secret: string, enc: string) => {
      const dec = decrypt(secret, enc);
      evt.returnValue = dec;
    }
  );

  ipcMain.on(
    ChannelType.AES_ENCRYPT_CALL,
    (evt, secret: string, msg: string) => {
      const enc = encrypt(secret, msg);
      evt.returnValue = enc;
    }
  );
}
