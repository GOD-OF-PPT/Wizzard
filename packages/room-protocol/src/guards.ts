export type JsonRecord = Record<string, unknown>;

export function hasOwn(value: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

export function hasOnlyKeys(
  value: JsonRecord,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  const allowed = new Set([...required, ...optional]);

  return (
    required.every((key) => hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isBoundedString(
  value: unknown,
  minimum: number,
  maximum: number,
): value is string {
  return (
    typeof value === "string" &&
    value.length >= minimum &&
    value.length <= maximum
  );
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value);
}

export function isNonNegativeInteger(value: unknown): value is number {
  return isSafeInteger(value) && value >= 0;
}

export function isPositiveInteger(value: unknown): value is number {
  return isSafeInteger(value) && value > 0;
}

export function isNullable<T>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
): value is T | null {
  return value === null || predicate(value);
}

export function isArrayOf<T>(
  value: unknown,
  predicate: (candidate: unknown) => candidate is T,
): value is T[];
export function isArrayOf(
  value: unknown,
  predicate: (candidate: unknown) => boolean,
): value is unknown[];
export function isArrayOf(
  value: unknown,
  predicate: (candidate: unknown) => boolean,
): value is unknown[] {
  return Array.isArray(value) && value.every(predicate);
}

export function isIdentifier(value: unknown): value is string {
  return (
    isBoundedString(value, 1, 128) &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

export function isRequestId(value: unknown): value is string {
  return (
    isBoundedString(value, 1, 96) && /^[A-Za-z0-9._:-]+$/.test(value)
  );
}
