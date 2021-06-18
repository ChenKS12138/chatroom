import * as assert from "assert";
import { quickMod, generatePrime, generatePrivateKey } from "../diffie-hellman";

describe("Diffie Hellman", () => {
  describe("quickMod", () => {
    it("should exponenting by squaring", () => {
      assert.strictEqual(quickMod(5, 6, 23), Number(5n ** 6n % 23n));
      assert.strictEqual(quickMod(5, 15, 23), Number(5n ** 15n % 23n));
      assert.strictEqual(quickMod(7, 5, 23), Number(7n ** 5n % 23n));
      assert.strictEqual(quickMod(13, 5, 23), Number(13n ** 5n % 23n));
    });
  });
  describe("public key", () => {
    it("should share key two client", () => {
      const g = 2;
      const p = generatePrime();
      const pvk1 = generatePrivateKey();
      const pvk2 = generatePrivateKey();
      const pbk1 = quickMod(g, pvk1, p);
      const pbk2 = quickMod(g, pvk2, p);
      assert.strictEqual(quickMod(pbk1, pvk2, p), quickMod(pbk2, pvk1, p));
    });
  });
});
