import { tool } from "@opencode-ai/plugin";

export default tool({
  description:
    "Generate one or more UUIDv7 identifiers. UUIDv7 is a time-ordered UUID that encodes a Unix timestamp in milliseconds in the most-significant bits, making it ideal for use as a database primary key.",
  args: {
    count: tool.schema
      .number()
      .int()
      .min(1)
      .max(100)
      .default(1)
      .describe("How many UUIDv7 values to generate (1–100, default 1)"),
  },
  async execute(args) {
    const uuids: string[] = [];

    for (let i = 0; i < args.count; i++) {
      uuids.push(generateUUIDv7());
    }

    return args.count === 1 ? uuids[0] : uuids.join("\n");
  },
});

function generateUUIDv7(): string {
  // 48-bit Unix timestamp in milliseconds
  const now = Date.now();
  const msHigh = Math.floor(now / 0x100000000); // upper 16 bits of the 48-bit ms value
  const msLow = now >>> 0;                       // lower 32 bits

  // 16 random bytes as a base
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  // Bytes 0–5: 48-bit timestamp (big-endian)
  bytes[0] = (msHigh >>> 8) & 0xff;
  bytes[1] = msHigh & 0xff;
  bytes[2] = (msLow >>> 24) & 0xff;
  bytes[3] = (msLow >>> 16) & 0xff;
  bytes[4] = (msLow >>> 8) & 0xff;
  bytes[5] = msLow & 0xff;

  // Byte 6: version = 0x7, top 4 bits; keep lower 4 bits random
  bytes[6] = (0x70) | (bytes[6] & 0x0f);

  // Byte 8: variant = 0b10xxxxxx (RFC 4122)
  bytes[8] = (0x80) | (bytes[8] & 0x3f);

  // Format as xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}
