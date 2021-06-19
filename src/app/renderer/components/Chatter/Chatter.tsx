import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCrypto } from "../../hooks/cryptoHook";
import { useMessageValue } from "../../hooks/messageHook";
import * as constants from "@/common/constants";

export enum ChatterRecordType {
  MESSAGE = 0,
  LOG = 1,
}

export interface IChatterRecord {
  uid?: string;
  text: string;
  encrypted?: boolean;
  type: ChatterRecordType;
}

interface IChatter {
  disabled?: boolean;
  onSendText?: (text: string, encrypt: boolean) => void;
  onRequestNegotiatePbk?: () => void;
  records: IChatterRecord[];
  enableEncrypt?: boolean;
}

export function Chatter({
  disabled,
  onRequestNegotiatePbk,
  onSendText,
  records,
  enableEncrypt,
}: IChatter) {
  const [text, setText] = useState("");
  const chatterDisabled = useMemo(() => disabled || false, [disabled]);
  const recordsRef = useRef<any>(null);

  const handleType = useCallback(
    (event) => {
      setText(event.target.value);
    },
    [setText]
  );

  useEffect(() => {
    if (recordsRef.current) {
      recordsRef.current.scrollTop = recordsRef.current.scrollHeight;
    }
  }, [records, recordsRef]);

  return (
    <div className="chatroom-container">
      <div className="chatroom-records" ref={recordsRef}>
        {records.map((record, index) => (
          <ChatRecord
            key={index}
            text={record.text}
            uid={record?.uid ?? ""}
            encrypted={record?.encrypted ?? false}
            type={record.type}
          />
        ))}
      </div>
      <div className="chatroom-typearea">
        <textarea
          value={text}
          onInput={handleType}
          className="chatroom-typearea-textarea"
          disabled={chatterDisabled}
        ></textarea>
        <div className="chatroom-typearea-buttons">
          <button
            disabled={chatterDisabled || !text.length}
            onClick={() => {
              setText("");
              onSendText && onSendText(text, false);
            }}
          >
            明文发送
          </button>
          <button
            disabled={!enableEncrypt || chatterDisabled || !text.length}
            onClick={() => {
              setText("");
              onSendText && onSendText(text, true);
            }}
          >
            加密发送
          </button>
          <button
            disabled={chatterDisabled}
            onClick={() => {
              onRequestNegotiatePbk && onRequestNegotiatePbk();
            }}
          >
            协商密钥
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatRecord({ text, uid, encrypted, type }: IChatterRecord) {
  const pbk = useMessageValue<string>(constants.ChannelType.UPDATE_PBK);
  const { decrypt } = useCrypto();
  const [decryptedMsg, setDecryptedMsg] = useState("");

  const handleDecryptClick = useCallback(() => {
    setDecryptedMsg(decrypt(pbk, text));
  }, [setDecryptedMsg, decrypt, pbk, text]);

  if (type === ChatterRecordType.LOG) {
    return <div className="record-log">----{text}----</div>;
  }
  return (
    <div>
      <span className="chatroom-records-author">{uid}</span>
      <span>{text}</span>
      {encrypted && pbk?.length && (
        <>
          <button
            onClick={handleDecryptClick}
            className="chatroom-records-decrypt-btn"
          >
            解密消息
          </button>
          <span>{decryptedMsg}</span>
        </>
      )}
    </div>
  );
}
