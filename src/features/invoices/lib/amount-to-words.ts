/**
 * Amount to Words Conversion
 *
 * Converts numeric amounts to French words for invoice display
 * Example: 7200 → "Sept Mille Deux Cent Dirhams (TTC)"
 *
 * @module amount-to-words
 */

// French number words - Units (0-9)
const UNITS = [
  "",
  "Un",
  "Deux",
  "Trois",
  "Quatre",
  "Cinq",
  "Six",
  "Sept",
  "Huit",
  "Neuf",
];

// French number words - Teens (10-19)
const TEENS = [
  "Dix",
  "Onze",
  "Douze",
  "Treize",
  "Quatorze",
  "Quinze",
  "Seize",
  "Dix-Sept",
  "Dix-Huit",
  "Dix-Neuf",
];

// French number words - Tens (20-90)
const TENS = [
  "",
  "",
  "Vingt",
  "Trente",
  "Quarante",
  "Cinquante",
  "Soixante",
  "Soixante-Dix",
  "Quatre-Vingt",
  "Quatre-Vingt-Dix",
];

/**
 * Convert a number (0-99) to French words
 *
 * @param n - Number to convert (0-99)
 * @returns French word representation
 *
 * @example
 * ```typescript
 * convertTwoDigits(0)   // ""
 * convertTwoDigits(1)   // "Un"
 * convertTwoDigits(15)  // "Quinze"
 * convertTwoDigits(21)  // "Vingt et Un"
 * convertTwoDigits(80)  // "Quatre-Vingt"
 * convertTwoDigits(99)  // "Quatre-Vingt-Dix-Neuf"
 * ```
 */
function convertTwoDigits(n: number): string {
  if (n === 0) return "";
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];

  const tens = Math.floor(n / 10);
  const units = n % 10;

  // Special cases for French numbers
  // 70-79: soixante-dix, soixante-et-onze, etc.
  // 90-99: quatre-vingt-dix, quatre-vingt-onze, etc.
  if (tens === 7) {
    if (units === 1) return "Soixante et Onze";
    return `Soixante-${TEENS[units]}`;
  }

  if (tens === 9) {
    if (units === 1) return "Quatre-Vingt-Onze";
    return `Quatre-Vingt-${TEENS[units]}`;
  }

  // 80: Quatre-Vingt (no 's' when followed by units)
  // 81-89: Quatre-Vingt-Un, etc.
  if (tens === 8) {
    if (units === 0) return "Quatre-Vingt";
    return `Quatre-Vingt-${UNITS[units]}`;
  }

  // Standard tens (20-60)
  // Special case: 21, 31, 41, 51, 61 use "et" (and)
  if (units === 1 && tens >= 2 && tens <= 6) {
    return `${TENS[tens]} et Un`;
  }

  // Standard combination
  if (units === 0) return TENS[tens];
  return `${TENS[tens]}-${UNITS[units]}`;
}

/**
 * Convert a number (0-999) to French words
 *
 * @param n - Number to convert (0-999)
 * @returns French word representation
 *
 * @example
 * ```typescript
 * convertThreeDigits(0)     // ""
 * convertThreeDigits(100)   // "Cent"
 * convertThreeDigits(200)   // "Deux Cent"
 * convertThreeDigits(250)   // "Deux Cent Cinquante"
 * convertThreeDigits(999)   // "Neuf Cent Quatre-Vingt-Dix-Neuf"
 * ```
 */
function convertThreeDigits(n: number): string {
  if (n === 0) return "";

  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  let result = "";

  if (hundreds > 0) {
    if (hundreds === 1) {
      result = "Cent";
    } else {
      result = `${UNITS[hundreds]} Cent`;
    }

    // NOTE: "Cent" is NEVER pluralized in this function
    // Pluralization (adding 's') only happens in the final amountToWords
    // when "cent" is the absolute last word before the currency
    // Examples:
    // 200 alone would be "Deux Cent" here
    // 1200 would be "Mille Deux Cent"
    // The calling function adds the 's' if needed
  }

  if (remainder > 0) {
    const remainderWords = convertTwoDigits(remainder);
    if (result) {
      result += ` ${remainderWords}`;
    } else {
      result = remainderWords;
    }
  }

  return result;
}

/**
 * Convert amount to French words with currency
 *
 * Converts numeric amount to French words and appends currency and TTC notation.
 * Handles amounts up to 999,999 (less than 1 million).
 * Decimal amounts are rounded to nearest integer.
 *
 * @param amount - Amount to convert (will be rounded to nearest integer)
 * @param currency - Currency name (default: "Dirhams")
 * @returns French words representation with currency and TTC
 *
 * @example
 * ```typescript
 * amountToWords(0)       // "Zéro Dirhams (TTC)"
 * amountToWords(1)       // "Un Dirhams (TTC)"
 * amountToWords(100)     // "Cent Dirhams (TTC)"
 * amountToWords(1000)    // "Mille Dirhams (TTC)"
 * amountToWords(7200)    // "Sept Mille Deux Cent Dirhams (TTC)"
 * amountToWords(50500)   // "Cinquante Mille Cinq Cent Dirhams (TTC)"
 * amountToWords(7200.50) // "Sept Mille Deux Cent Dirhams (TTC)" (rounded)
 * amountToWords(7200, "Euros") // "Sept Mille Deux Cent Euros (TTC)"
 * ```
 */
export function amountToWords(
  amount: number,
  currency: string = "Dirhams"
): string {
  // Round to nearest integer
  const roundedAmount = Math.round(amount);

  // Handle zero
  if (roundedAmount === 0) {
    return `Zéro ${currency} (TTC)`;
  }

  // Handle negative numbers
  if (roundedAmount < 0) {
    const positiveWords = amountToWords(Math.abs(roundedAmount), currency);
    return `Moins ${positiveWords}`;
  }

  // Handle amounts >= 1 million (not expected in typical invoices)
  if (roundedAmount >= 1000000) {
    throw new Error("Amount exceeds maximum supported value (999,999)");
  }

  let result = "";

  // Thousands (1,000 - 999,999)
  const thousands = Math.floor(roundedAmount / 1000);
  const remainder = roundedAmount % 1000;

  if (thousands > 0) {
    if (thousands === 1) {
      result = "Mille";
    } else {
      result = `${convertThreeDigits(thousands)} Mille`;
    }
  }

  // Hundreds (0-999)
  if (remainder > 0) {
    const remainderWords = convertThreeDigits(remainder);
    if (result) {
      result += ` ${remainderWords}`;
    } else {
      result = remainderWords;
    }
  }

  // Add pluralization to "Cent" ONLY if it's the last word before currency
  // This means: multiple hundreds (Deux, Trois, etc.) + Cent with NO other words after
  // Examples that should get 's':
  //   - "Deux Cent" (200) → "Deux Cents"
  //   - "Trois Cent" (300) → "Trois Cents"
  //   - "Mille Deux Cent" (1200) → stays "Mille Deux Cent" (has Mille before)
  // Pattern matches: (Deux|Trois|...|Neuf) Cent at the end
  // But only if it's NOT preceded by "Mille" (which indicates it's part of larger number)
  const isStandaloneCent = /^(Deux|Trois|Quatre|Cinq|Six|Sept|Huit|Neuf) Cent$/;
  if (isStandaloneCent.test(result)) {
    result += "s";
  }

  return `${result} ${currency} (TTC)`;
}

/**
 * Format amount as French words for invoice display
 * This is the main export function to use in invoice generation
 *
 * @param amount - Amount to convert
 * @returns Formatted French words for invoice
 *
 * @example
 * ```typescript
 * formatInvoiceAmount(7200)  // "Sept Mille Deux Cent Dirhams (TTC)"
 * ```
 */
export function formatInvoiceAmount(amount: number): string {
  return amountToWords(amount, "Dirhams");
}
