/**
 * Utility untuk menyamarkan (masking) atribut data sensitif pada payload Audit Log.
 * Memastikan kredensial, hash, token, data perbankan, dan data pribadi tidak bocor ke antarmuka.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /hash/i,
  /salt/i,
  /pin/i,
  /nik/i,
  /npwp/i,
  /rekening/i,
  /bank_account/i,
  /bankaccount/i,
  /salary/i,
  /gaji/i,
  /auth_secret/i,
  /private_key/i,
  /privatekey/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (typeof data === "object") {
    const maskedObj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        maskedObj[key] = "[disembunyikan]";
      } else if (typeof value === "object" && value !== null) {
        maskedObj[key] = maskSensitiveData(value);
      } else {
        maskedObj[key] = value;
      }
    }

    return maskedObj;
  }

  return data;
}
