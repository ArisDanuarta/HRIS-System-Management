import crypto from "node:crypto";

/**
 * Generate password sementara acak yang aman dan memenuhi standar kompleksitas
 * (Minimal 12 karakter, huruf besar, huruf kecil, angka, simbol)
 */
export function generateSecureTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*";

  const allChars = upper + lower + numbers + symbols;

  // Pastikan minimal satu dari tiap grup karakter
  const mustHave = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ];

  const remainingLength = 8;
  const randomChars = Array.from({ length: remainingLength }, () => {
    return allChars[crypto.randomInt(0, allChars.length)];
  });

  // Gabungkan dan acak urutannya
  const passwordArray = [...mustHave, ...randomChars].sort(() => Math.random() - 0.5);
  return `Pspk&${passwordArray.join("")}`;
}
