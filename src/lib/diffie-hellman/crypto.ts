import * as crypto from "crypto";

const AES_ALGORITHM = "aes-256-cbc";

const INPUT_ENCODING = "utf8";
const OUTPUT_ENCODING = "base64";

function generateAesKey(secret: string): Buffer {
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(secret: string, msg: string): string {
  const encipher = crypto.createCipheriv(
    AES_ALGORITHM,
    generateAesKey(secret),
    Buffer.from(new Uint8Array(16))
  );
  return (
    encipher.update(msg, INPUT_ENCODING, OUTPUT_ENCODING) +
    encipher.final(OUTPUT_ENCODING)
  );
}

export function decrypt(secret: string, encBase64: string): string {
  const decipher = crypto.createDecipheriv(
    AES_ALGORITHM,
    generateAesKey(secret),
    Buffer.from(new Uint8Array(16))
  );
  return (
    decipher.update(encBase64, OUTPUT_ENCODING, INPUT_ENCODING) +
    decipher.final(INPUT_ENCODING)
  );
}
