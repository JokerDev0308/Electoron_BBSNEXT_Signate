import cryptoJs from 'crypto-js';

export function encrypt(secretKey: string, text: string) {
  return cryptoJs.AES.encrypt(text, secretKey).toString();
}

export function decrypt(secretKey: string, hash: string): string {
  const bytes = cryptoJs.AES.decrypt(hash, secretKey);
  return bytes.toString(cryptoJs.enc.Utf8);
}

export function sha256(text: string): string {
  return cryptoJs.SHA256(text).toString();
}
