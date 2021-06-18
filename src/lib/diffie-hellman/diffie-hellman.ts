/**
 * 快速幂取模算法
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @returns {number} (a^b)%c
 */
export function quickMod(a: number, b: number, c: number) {
  let ans = 1;
  a = a % c;
  while (b !== 0) {
    if (b & 1) {
      ans = (ans * a) % c;
    }
    b >>= 1;
    a = (a * a) % c;
  }
  return ans;
}

/**
 * TODO
 * 需要选取一个更大的质数，来确共享密钥的空间足够大，防止暴力攻击
 * https://datatracker.ietf.org/doc/html/rfc3526#page-3
 * @param length
 * @returns {number}
 */
export function generatePrime(length?: number) {
  return 915799;
}

/**
 * 获得随机密钥
 * @param length
 * @returns
 */
export function generatePrivateKey(length?: number) {
  return Math.floor(Math.random() * 1000000) + 1000000;
}

/**
 * 生成生成元
 * @returns
 */
export function generateG() {
  return 2;
}

/**
 * 生成公钥
 * @param input
 * @param privateKey
 * @param prime
 * @returns
 */
export function generatePublicKey(
  input: number,
  privateKey: number,
  prime: number
): number {
  return quickMod(input, privateKey, prime);
}
