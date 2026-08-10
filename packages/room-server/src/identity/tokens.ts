import {
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";
import { ROOM_CODE_LENGTH } from "@wizzard/room-protocol";

const DEFAULT_SECRET_BYTES = 32;
const MAX_TOKEN_CHARACTERS = 512;
const ID_SEGMENT_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const ROOM_CODE_DIGITS = "23456789";

export type TokenPurpose = "connection" | "invite" | "resume";

export type IssuedToken = {
  token: string;
  tokenHash: string;
};

export type ParsedInviteToken = {
  roomId: string;
};

export type ParsedResumeToken = {
  playerId: string;
  roomId: string;
};

function assertIdSegment(value: string, label: string): void {
  if (!ID_SEGMENT_PATTERN.test(value)) {
    throw new Error(`${label}_INVALID`);
  }
}

function isCanonicalSecret(secret: string): boolean {
  if (!SECRET_PATTERN.test(secret)) {
    return false;
  }

  const bytes = Buffer.from(secret, "base64url");
  return (
    bytes.length === DEFAULT_SECRET_BYTES &&
    bytes.toString("base64url") === secret
  );
}

function isHashableToken(token: string): boolean {
  return token.length > 0 && token.length <= MAX_TOKEN_CHARACTERS;
}

function inferTokenPurpose(token: string): TokenPurpose {
  if (token.startsWith("i1.")) {
    return "invite";
  }

  if (token.startsWith("r1.")) {
    return "resume";
  }

  return "connection";
}

export function generateOpaqueSecret(
  byteLength = DEFAULT_SECRET_BYTES,
): string {
  if (
    !Number.isSafeInteger(byteLength) ||
    byteLength < 16 ||
    byteLength > 64
  ) {
    throw new Error("TOKEN_BYTE_LENGTH_INVALID");
  }

  return randomBytes(byteLength).toString("base64url");
}

export function hashToken(
  token: string,
  purpose: TokenPurpose = inferTokenPurpose(token),
): string {
  if (!isHashableToken(token)) {
    throw new Error("TOKEN_INVALID");
  }

  return createHash("sha256")
    .update(`wizzard-token:${purpose}:v1\0`, "utf8")
    .update(token, "utf8")
    .digest("hex");
}

export function verifyToken(
  token: string,
  expectedHash: string,
  purpose: TokenPurpose,
): boolean {
  if (!isHashableToken(token) || !HASH_PATTERN.test(expectedHash)) {
    return false;
  }

  const actual = Buffer.from(hashToken(token, purpose), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function issueInviteToken(roomId: string): IssuedToken {
  assertIdSegment(roomId, "ROOM_ID");
  const token = `i1.${roomId}.${generateOpaqueSecret()}`;
  return { token, tokenHash: hashToken(token, "invite") };
}

export function parseInviteToken(token: string): ParsedInviteToken | null {
  if (!isHashableToken(token)) {
    return null;
  }

  const [version, roomId, secret, overflow] = token.split(".");

  if (
    overflow !== undefined ||
    version !== "i1" ||
    !roomId ||
    !ID_SEGMENT_PATTERN.test(roomId) ||
    !secret ||
    !isCanonicalSecret(secret)
  ) {
    return null;
  }

  return { roomId };
}

export function verifyInviteToken(
  token: string,
  expectedHash: string,
): boolean {
  return (
    parseInviteToken(token) !== null &&
    verifyToken(token, expectedHash, "invite")
  );
}

export function rotateInviteToken(roomId: string): IssuedToken {
  return issueInviteToken(roomId);
}

export function issueResumeToken(
  roomId: string,
  playerId: string,
): IssuedToken {
  assertIdSegment(roomId, "ROOM_ID");
  assertIdSegment(playerId, "PLAYER_ID");
  const token = `r1.${roomId}.${playerId}.${generateOpaqueSecret()}`;
  return { token, tokenHash: hashToken(token, "resume") };
}

export function parseResumeToken(token: string): ParsedResumeToken | null {
  if (!isHashableToken(token)) {
    return null;
  }

  const [version, roomId, playerId, secret, overflow] = token.split(".");

  if (
    overflow !== undefined ||
    version !== "r1" ||
    !roomId ||
    !ID_SEGMENT_PATTERN.test(roomId) ||
    !playerId ||
    !ID_SEGMENT_PATTERN.test(playerId) ||
    !secret ||
    !isCanonicalSecret(secret)
  ) {
    return null;
  }

  return { playerId, roomId };
}

export function verifyResumeToken(
  token: string,
  expectedHash: string,
): boolean {
  return (
    parseResumeToken(token) !== null &&
    verifyToken(token, expectedHash, "resume")
  );
}

export function rotateResumeToken(
  roomId: string,
  playerId: string,
): IssuedToken {
  return issueResumeToken(roomId, playerId);
}

export function generateRoomCode(): string {
  let code = "";
  // Digits 2-9 keep the staged server-first rollout readable by the previous
  // client while still removing letters from every newly generated code.
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_CODE_DIGITS[randomInt(0, ROOM_CODE_DIGITS.length)];
  }

  return code;
}
