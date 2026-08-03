import { describe, expect, it } from "vitest";
import {
  generateRoomCode,
  hashToken,
  issueInviteToken,
  issueResumeToken,
  parseInviteToken,
  parseResumeToken,
  rotateInviteToken,
  rotateResumeToken,
  verifyInviteToken,
  verifyResumeToken,
  verifyToken,
} from "../src/identity/index.js";

describe("room identity tokens", () => {
  it("issues parseable invite tokens while persisting only a verifier", () => {
    const issued = issueInviteToken("room-123");

    expect(issued.token).toMatch(/^i1\.room-123\.[A-Za-z0-9_-]{43}$/);
    expect(issued.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(parseInviteToken(issued.token)).toEqual({ roomId: "room-123" });
    expect(verifyInviteToken(issued.token, issued.tokenHash)).toBe(true);
    expect(verifyInviteToken(`${issued.token}x`, issued.tokenHash)).toBe(false);
  });

  it("binds resume tokens to both room and player identity", () => {
    const issued = issueResumeToken("room-123", "player-456");

    expect(parseResumeToken(issued.token)).toEqual({
      playerId: "player-456",
      roomId: "room-123",
    });
    expect(verifyResumeToken(issued.token, issued.tokenHash)).toBe(true);
    expect(parseResumeToken(issued.token.replace("player-456", "other"))).toEqual(
      { playerId: "other", roomId: "room-123" },
    );
    expect(
      verifyResumeToken(
        issued.token.replace("player-456", "other"),
        issued.tokenHash,
      ),
    ).toBe(false);
  });

  it("rotates tokens without retaining or accepting the previous secret", () => {
    const invite = issueInviteToken("room-123");
    const nextInvite = rotateInviteToken("room-123");
    const resume = issueResumeToken("room-123", "player-456");
    const nextResume = rotateResumeToken("room-123", "player-456");

    expect(nextInvite.token).not.toBe(invite.token);
    expect(verifyInviteToken(invite.token, nextInvite.tokenHash)).toBe(false);
    expect(nextResume.token).not.toBe(resume.token);
    expect(verifyResumeToken(resume.token, nextResume.tokenHash)).toBe(false);
  });

  it("domain-separates hashes and rejects malformed tokens safely", () => {
    const token = issueInviteToken("room-123").token;
    const inviteHash = hashToken(token, "invite");

    expect(hashToken(token)).toBe(inviteHash);
    expect(hashToken(token, "resume")).not.toBe(inviteHash);
    expect(verifyToken(token, inviteHash, "invite")).toBe(true);
    expect(verifyToken(token, "not-a-hash", "invite")).toBe(false);
    expect(parseInviteToken("i1.bad.id.secret")).toBeNull();
    expect(parseResumeToken("r1.room.player.short")).toBeNull();
  });

  it("generates human-friendly room codes without ambiguous glyphs", () => {
    const codes = Array.from({ length: 20 }, () => generateRoomCode());

    expect(codes.every((code) => /^[A-HJ-NP-Z2-9]{6}$/.test(code))).toBe(true);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
