import CryptoJS from "crypto-js";
import { env } from "@/lib/env";

const key = CryptoJS.enc.Utf8.parse(env.ENCRYPTION_KEY.slice(0, 32));

export function encryptSecret(value: string): string {
  return CryptoJS.AES.encrypt(value, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

export function decryptSecret(cipherText: string): string {
  const bytes = CryptoJS.AES.decrypt(cipherText, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return bytes.toString(CryptoJS.enc.Utf8);
}
