import Long from "long";

/**
 * 快速幂取模算法
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {number} (a^b)%c
 */
export function quickMod(a: Long, b: Long, c: Long): Long {
  let ans = new Long(1);
  a = a.mod(c);
  while (b.notEquals(0)) {
    if (b.and(1).notEquals(0)) {
      ans = ans.multiply(a).mod(c);
    }
    b = b.shiftRight(1);
    a = a.multiply(a).mod(c);
  }
  return ans;
}

/**
 * @param length
 * @returns {number}
 */
export function generatePrime(length?: number): Long {
  return new Long(99194853094755497);
}

/**
 * 获得随机密钥
 * @param length
 * @returns
 */
export function generatePrivateKey(length?: number): Long {
  return new Long(Math.ceil(Math.random() * 99194853094755497));
}

/**
 * 生成生成元
 * @returns
 */
export function generateG(): Long {
  return new Long(2);
}

/**
 * 生成公钥
 * @param input
 * @param privateKey
 * @param prime
 * @returns
 */
export function generatePublicKey(
  input: Long,
  privateKey: Long,
  prime: Long
): Long {
  return quickMod(input, privateKey, prime);
}
