// cryptoRandom.js - Cryptographically secure unbiased random selection

/**
 * Returns an unbiased random integer in [0, maxExclusive - 1]
 * Uses rejection sampling to eliminate modulo bias.
 */
export function getCryptoRandomInt(maxExclusive) {
  if (maxExclusive <= 1) return 0;

  const cryptoObj = window.crypto || window.msCrypto;
  if (!cryptoObj || !cryptoObj.getRandomValues) {
    return Math.floor(Math.random() * maxExclusive);
  }

  const range = maxExclusive;
  const maxUint32 = 0xFFFFFFFF;
  // Largest multiple of range <= maxUint32
  const limit = maxUint32 - (maxUint32 % range);

  const buffer = new Uint32Array(1);
  let randomVal;

  do {
    cryptoObj.getRandomValues(buffer);
    randomVal = buffer[0];
  } while (randomVal >= limit);

  return randomVal % range;
}

/**
 * Picks a random item from an array using crypto RNG
 */
export function pickCryptoRandom(array) {
  if (!array || array.length === 0) return null;
  const index = getCryptoRandomInt(array.length);
  return {
    item: array[index],
    index
  };
}

/**
 * Shuffles array in-place or returning copy using Fisher-Yates with crypto RNG
 */
export function cryptoShuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = getCryptoRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

