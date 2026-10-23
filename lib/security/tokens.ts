import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual, randomUUID } from "node:crypto";

export const generateAccessToken = () => randomBytes(32).toString("base64url");

export const hashAccessToken = (token: string) =>
  createHash("sha256").update(token, "utf8").digest("hex");

const deriveKey = (secret: string) => createHash("sha256").update(secret, "utf8").digest();

export const encryptAccessToken = (token: string, secret: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
};

export const decryptAccessToken = (value: string, secret: string) => {
  const [ivEncoded, tagEncoded, dataEncoded] = value.split(".");
  if (!ivEncoded || !tagEncoded || !dataEncoded) throw new Error("Invalid encrypted token format");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivEncoded, "base64url"));
  decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(dataEncoded, "base64url")), decipher.final()]).toString("utf8");
};

export const verifyAccessToken = (token: string, expectedHash: string) => {
  if (!token || !expectedHash) return false;
  const candidate = Buffer.from(hashAccessToken(token), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
};

export const newId = () => randomUUID();

export const newOrderNumber = () => {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return "MG-" + year + month + "-" + random;
};

export const buildOrderLink = (appUrl: string, orderId: string, token: string) =>
  appUrl + "/order/" + orderId + "?token=" + encodeURIComponent(token);
