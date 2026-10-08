import { installWebCrypto } from './webCrypto';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: jest.fn(async (_algorithm: string, data: Uint8Array) => {
    const hash = require('node:crypto').createHash('sha256').update(data).digest();
    return hash.buffer.slice(hash.byteOffset, hash.byteOffset + hash.byteLength);
  }),
  getRandomValues: jest.fn(<T extends Uint8Array | Uint32Array>(array: T) => require('node:crypto').randomFillSync(array)),
}));

const base64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('installWebCrypto', () => {
  it('provides SHA-256 digest so PKCE uses the S256 challenge (RFC 7636 example)', async () => {
    const target: { crypto?: Crypto } = {};
    installWebCrypto(target);

    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const hash = await target.crypto!.subtle.digest('SHA-256', new TextEncoder().encode(verifier));

    expect(base64url(new Uint8Array(hash))).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('provides secure random values for the verifier', () => {
    const target: { crypto?: Crypto } = {};
    installWebCrypto(target);
    const values = target.crypto!.getRandomValues(new Uint32Array(4));
    expect(values).toHaveLength(4);
  });

  it('rejects digests other than SHA-256 instead of computing the wrong hash', async () => {
    const target: { crypto?: Crypto } = {};
    installWebCrypto(target);
    await expect(target.crypto!.subtle.digest('SHA-1', new Uint8Array())).rejects.toThrow('SHA-1');
  });

  it('keeps an existing implementation untouched', () => {
    const existing = { getRandomValues: jest.fn(), subtle: { digest: jest.fn() } } as unknown as Crypto;
    const target = { crypto: existing };
    installWebCrypto(target);
    expect(target.crypto).toBe(existing);
    expect(target.crypto.subtle).toBe(existing.subtle);
  });
});
