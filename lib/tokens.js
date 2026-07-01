import crypto from "crypto";

// Format: fbar_live_<40 random hex chars> — easy to recognize, easy to revoke.
export function generateRawToken() {
  const random = crypto.randomBytes(24).toString("hex");
  return `fbar_live_${random}`;
}

export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function last4Of(rawToken) {
  return rawToken.slice(-4);
}
