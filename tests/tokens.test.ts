import { describe, expect, it } from "vitest";
import {
  buildOrderLink,
  decryptAccessToken,
  encryptAccessToken,
  generateAccessToken,
  hashAccessToken,
  newOrderNumber,
  verifyAccessToken,
} from "@/lib/security/tokens";

const SECRET = "test-secret-with-at-least-32-characters-long";

describe("access tokens", () => {
  it("generates unique url-safe tokens", () => {
    const first = generateAccessToken();
    const second = generateAccessToken();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });

  it("hashes tokens deterministically as sha-256 hex", () => {
    const token = "orders-token-sample";
    const hash = hashAccessToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashAccessToken(token)).toBe(hash);
    expect(hashAccessToken(token + "x")).not.toBe(hash);
  });

  it("verifies only the matching token", () => {
    const token = generateAccessToken();
    const hash = hashAccessToken(token);
    expect(verifyAccessToken(token, hash)).toBe(true);
    expect(verifyAccessToken(generateAccessToken(), hash)).toBe(false);
    expect(verifyAccessToken("", hash)).toBe(false);
    expect(verifyAccessToken(token, "")).toBe(false);
    expect(verifyAccessToken(token, "not-a-hash")).toBe(false);
  });

  it("encrypts and decrypts a token with the same secret", () => {
    const token = generateAccessToken();
    const encrypted = encryptAccessToken(token, SECRET);
    expect(encrypted).not.toContain(token);
    expect(encrypted.split(".")).toHaveLength(3);
    expect(decryptAccessToken(encrypted, SECRET)).toBe(token);
  });

  it("rejects a token encrypted with another secret or tampered with", () => {
    const token = generateAccessToken();
    const secret = "another-secret-with-at-least-32-characters";
    const encrypted = encryptAccessToken(token, SECRET);
    expect(() => decryptAccessToken(encrypted, secret)).toThrow();

    const [iv, tag, data] = encrypted.split(".");
    const tampered = data.slice(0, -2) + (data.endsWith("AA") ? "BB" : "AA");
    expect(() => decryptAccessToken([iv, tag, tampered].join("."), SECRET)).toThrow();
    expect(() => decryptAccessToken("broken", SECRET)).toThrow();
  });
});

describe("order helpers", () => {
  it("builds human-readable order numbers", () => {
    const first = newOrderNumber();
    const second = newOrderNumber();
    expect(first).toMatch(/^MG-\d{4}-[0-9A-F]{6}$/);
    expect(first).not.toBe(second);
  });

  it("encodes the token inside the order link", () => {
    const link = buildOrderLink("https://magia.example", "order-1", "a+b/c=");
    expect(link).toBe("https://magia.example/order/order-1?token=a%2Bb%2Fc%3D");
  });
});
