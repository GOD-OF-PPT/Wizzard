import { createHmac, randomBytes } from "node:crypto";

const ALGORITHM = "hmac-sha256-counter-v1" as const;
const KEY_BYTES = 32;
const UINT_26_FACTOR = 0x4000000;
const UINT_53_DENOMINATOR = 0x20_0000_0000_0000;
const HMAC_DOMAIN = "wizzard-room-rng-v1\0";

export type HmacCounterRandomState = {
  algorithm: typeof ALGORITHM;
  counter: number;
  keyBase64: string;
};

export type RandomSource = () => number;

function decodeKey(keyBase64: string): Buffer {
  if (!/^[A-Za-z0-9_-]{43}$/.test(keyBase64)) {
    throw new Error("RANDOM_KEY_INVALID");
  }

  const key = Buffer.from(keyBase64, "base64url");

  if (key.length !== KEY_BYTES || key.toString("base64url") !== keyBase64) {
    throw new Error("RANDOM_KEY_INVALID");
  }

  return key;
}

function assertState(state: HmacCounterRandomState): void {
  if (state.algorithm !== ALGORITHM) {
    throw new Error("RANDOM_ALGORITHM_UNSUPPORTED");
  }

  if (
    !Number.isSafeInteger(state.counter) ||
    state.counter < 0 ||
    state.counter > Number.MAX_SAFE_INTEGER
  ) {
    throw new Error("RANDOM_COUNTER_INVALID");
  }

  decodeKey(state.keyBase64);
}

export function createHmacCounterRandomState(
  key?: Uint8Array,
): HmacCounterRandomState {
  const keyBytes = key ? Buffer.from(key) : randomBytes(KEY_BYTES);

  if (keyBytes.length !== KEY_BYTES) {
    throw new Error("RANDOM_KEY_MUST_BE_32_BYTES");
  }

  return {
    algorithm: ALGORITHM,
    counter: 0,
    keyBase64: keyBytes.toString("base64url"),
  };
}

export class SerializableHmacRandom {
  private counter: number;
  private readonly key: Buffer;

  public readonly random: RandomSource = () => this.next();

  public constructor(state: HmacCounterRandomState) {
    assertState(state);
    this.counter = state.counter;
    this.key = decodeKey(state.keyBase64);
  }

  public next(): number {
    if (this.counter >= Number.MAX_SAFE_INTEGER) {
      throw new Error("RANDOM_COUNTER_EXHAUSTED");
    }

    const counterBytes = Buffer.allocUnsafe(8);
    counterBytes.writeBigUInt64BE(BigInt(this.counter));
    const digest = createHmac("sha256", this.key)
      .update(HMAC_DOMAIN, "utf8")
      .update(counterBytes)
      .digest();
    this.counter += 1;

    const high27 = digest.readUInt32BE(0) >>> 5;
    const low26 = digest.readUInt32BE(4) >>> 6;
    return (
      (high27 * UINT_26_FACTOR + low26) /
      UINT_53_DENOMINATOR
    );
  }

  public snapshot(): HmacCounterRandomState {
    return {
      algorithm: ALGORITHM,
      counter: this.counter,
      keyBase64: this.key.toString("base64url"),
    };
  }
}

export function restoreHmacCounterRandom(
  state: HmacCounterRandomState,
): SerializableHmacRandom {
  return new SerializableHmacRandom({ ...state });
}

export function withHmacCounterRandom<TResult>(
  state: HmacCounterRandomState,
  operation: (random: RandomSource) => TResult,
): { result: TResult; state: HmacCounterRandomState } {
  const source = restoreHmacCounterRandom(state);
  const result = operation(source.random);
  return { result, state: source.snapshot() };
}
