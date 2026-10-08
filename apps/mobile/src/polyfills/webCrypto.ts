import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

const algorithmName = (algorithm: AlgorithmIdentifier) => (typeof algorithm === 'string' ? algorithm : algorithm.name).toUpperCase();

/**
 * React Native(Hermes)에 없는 WebCrypto 일부를 expo-crypto로 채운다.
 * supabase-js PKCE는 crypto.subtle이 없으면 SHA-256 대신 plain 방식으로, crypto가 없으면 Math.random 검증 값으로 떨어진다.
 * 이미 있는 구현은 건드리지 않는다.
 */
export function installWebCrypto(target: { crypto?: Crypto } = globalThis as { crypto?: Crypto }) {
  const current = target.crypto ?? ({} as Crypto);
  if (typeof current.getRandomValues !== 'function') {
    Object.defineProperty(current, 'getRandomValues', { value: getRandomValues, configurable: true });
  }
  if (!current.subtle) {
    const subtle = {
      digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        const name = algorithmName(algorithm);
        if (name !== 'SHA-256') throw new Error(`Unsupported digest algorithm: ${name}`);
        return digest(CryptoDigestAlgorithm.SHA256, data);
      },
    };
    Object.defineProperty(current, 'subtle', { value: subtle, configurable: true });
  }
  if (!target.crypto) target.crypto = current;
}
