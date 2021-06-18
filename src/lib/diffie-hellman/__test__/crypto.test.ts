import * as assert from "assert";
import { decrypt, encrypt } from "../crypto";

describe("crypto", () => {
  it("should encrypt/decrypt utf8 text", () => {
    const msg = "hello testtest 123123";
    const secret = "123123123131231231212312312313123234234";
    const enc = encrypt(secret, msg);
    const dec = decrypt(secret, enc);
    console.log("%s %s %s", msg, enc, dec);
    assert.strictEqual(msg, dec);
  });
});
