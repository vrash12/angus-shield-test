// Mirrors the rule Supabase Auth enforces on the server (minimum length 10,
// letters and digits), so people hear about it before they submit.
export const MIN_PASSWORD_LENGTH = 10;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return "Use letters and at least one number.";
  return null;
}

/**
 * True when the password appears in a known data breach (Have I Been Pwned).
 * Only the first 5 characters of its SHA-1 hash leave the device, never the
 * password. If the check can't run, sign-up isn't blocked.
 */
export async function isBreachedPassword(password: string): Promise<boolean> {
  try {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    const response = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return false;

    const suffix = hash.slice(5);
    return (await response.text()).split("\n").some((line) => {
      const [candidate, count] = line.trim().split(":");
      return candidate === suffix && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
