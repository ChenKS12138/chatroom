import * as assert from "assert";
import { quickMod, generatePrime, generatePrivateKey } from "../diffie-hellman";

import Long from "long";

describe("Diffie Hellman", () => {
  describe("quickMod", () => {
    it("should exponenting by squaring", () => {
      assert.strictEqual(
        quickMod(new Long(5), new Long(6), new Long(23)).toNumber(),
        Number(5n ** 6n % 23n)
      );
      assert.strictEqual(
        quickMod(new Long(5), new Long(15), new Long(23)).toNumber(),
        Number(5n ** 15n % 23n)
      );
      assert.strictEqual(
        quickMod(new Long(7), new Long(5), new Long(23)).toNumber(),
        Number(7n ** 5n % 23n)
      );
      assert.strictEqual(
        quickMod(new Long(13), new Long(5), new Long(23)).toNumber(),
        Number(13n ** 5n % 23n)
      );
    });
  });
  describe("public key", () => {
    it("should share key two client", () => {
      const g = new Long(2);
      const p = generatePrime();
      const pvk1 = generatePrivateKey();
      const pvk2 = generatePrivateKey();
      const pbk1 = quickMod(g, pvk1, p);
      const pbk2 = quickMod(g, pvk2, p);
      assert.strictEqual(
        quickMod(pbk1, pvk2, p).toNumber(),
        quickMod(pbk2, pvk1, p).toNumber()
      );
    });
  });
});
