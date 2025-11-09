import { describe, it, expect } from "vitest";
import { amountToWords, formatInvoiceAmount } from "../lib/amount-to-words";

describe("amountToWords", () => {
  describe("Edge Cases", () => {
    it("should convert zero to French words", () => {
      expect(amountToWords(0)).toBe("Zéro Dirhams (TTC)");
    });

    it("should handle decimal amounts with centimes", () => {
      expect(amountToWords(7200.4)).toBe(
        "Sept Mille Deux Cent Dirhams et Quarante Centimes (TTC)"
      );
      expect(amountToWords(7200.5)).toBe(
        "Sept Mille Deux Cent Dirhams et Cinquante Centimes (TTC)"
      );
      expect(amountToWords(7200.9)).toBe(
        "Sept Mille Deux Cent Dirhams et Quatre-Vingt-Dix Centimes (TTC)"
      );
    });

    it("should handle amounts with only centimes (no dirhams)", () => {
      expect(amountToWords(0.43)).toBe("Quarante-Trois Centimes (TTC)");
      expect(amountToWords(0.99)).toBe("Quatre-Vingt-Dix-Neuf Centimes (TTC)");
      expect(amountToWords(0.01)).toBe("Un Centimes (TTC)");
    });

    it("should handle centimes edge cases", () => {
      expect(amountToWords(100.21)).toBe(
        "Cent Dirhams et Vingt et Un Centimes (TTC)"
      );
      expect(amountToWords(1000.71)).toBe(
        "Mille Dirhams et Soixante et Onze Centimes (TTC)"
      );
      expect(amountToWords(500.8)).toBe(
        "Cinq Cents Dirhams et Quatre-Vingt Centimes (TTC)"
      );
    });

    it("should handle negative amounts", () => {
      expect(amountToWords(-100)).toBe("Moins Cent Dirhams (TTC)");
      expect(amountToWords(-7200)).toBe(
        "Moins Sept Mille Deux Cent Dirhams (TTC)"
      );
    });

    it("should throw error for amounts >= 1 million", () => {
      expect(() => amountToWords(1000000)).toThrow(
        "Amount exceeds maximum supported value"
      );
      expect(() => amountToWords(1500000)).toThrow(
        "Amount exceeds maximum supported value"
      );
    });
  });

  describe("Units (1-9)", () => {
    it("should convert single digits", () => {
      expect(amountToWords(1)).toBe("Un Dirhams (TTC)");
      expect(amountToWords(2)).toBe("Deux Dirhams (TTC)");
      expect(amountToWords(5)).toBe("Cinq Dirhams (TTC)");
      expect(amountToWords(9)).toBe("Neuf Dirhams (TTC)");
    });
  });

  describe("Teens (10-19)", () => {
    it("should convert teen numbers", () => {
      expect(amountToWords(10)).toBe("Dix Dirhams (TTC)");
      expect(amountToWords(11)).toBe("Onze Dirhams (TTC)");
      expect(amountToWords(15)).toBe("Quinze Dirhams (TTC)");
      expect(amountToWords(19)).toBe("Dix-Neuf Dirhams (TTC)");
    });
  });

  describe("Tens (20-99)", () => {
    it("should convert round tens", () => {
      expect(amountToWords(20)).toBe("Vingt Dirhams (TTC)");
      expect(amountToWords(30)).toBe("Trente Dirhams (TTC)");
      expect(amountToWords(50)).toBe("Cinquante Dirhams (TTC)");
      expect(amountToWords(60)).toBe("Soixante Dirhams (TTC)");
    });

    it("should handle 21, 31, 41, 51, 61 with 'et'", () => {
      expect(amountToWords(21)).toBe("Vingt et Un Dirhams (TTC)");
      expect(amountToWords(31)).toBe("Trente et Un Dirhams (TTC)");
      expect(amountToWords(41)).toBe("Quarante et Un Dirhams (TTC)");
      expect(amountToWords(51)).toBe("Cinquante et Un Dirhams (TTC)");
      expect(amountToWords(61)).toBe("Soixante et Un Dirhams (TTC)");
    });

    it("should handle standard tens combinations", () => {
      expect(amountToWords(22)).toBe("Vingt-Deux Dirhams (TTC)");
      expect(amountToWords(35)).toBe("Trente-Cinq Dirhams (TTC)");
      expect(amountToWords(48)).toBe("Quarante-Huit Dirhams (TTC)");
      expect(amountToWords(59)).toBe("Cinquante-Neuf Dirhams (TTC)");
    });

    it("should handle special case: 70-79 (soixante-dix)", () => {
      expect(amountToWords(70)).toBe("Soixante-Dix Dirhams (TTC)");
      expect(amountToWords(71)).toBe("Soixante et Onze Dirhams (TTC)");
      expect(amountToWords(75)).toBe("Soixante-Quinze Dirhams (TTC)");
      expect(amountToWords(79)).toBe("Soixante-Dix-Neuf Dirhams (TTC)");
    });

    it("should handle special case: 80-89 (quatre-vingt)", () => {
      expect(amountToWords(80)).toBe("Quatre-Vingt Dirhams (TTC)");
      expect(amountToWords(81)).toBe("Quatre-Vingt-Un Dirhams (TTC)");
      expect(amountToWords(85)).toBe("Quatre-Vingt-Cinq Dirhams (TTC)");
      expect(amountToWords(89)).toBe("Quatre-Vingt-Neuf Dirhams (TTC)");
    });

    it("should handle special case: 90-99 (quatre-vingt-dix)", () => {
      expect(amountToWords(90)).toBe("Quatre-Vingt-Dix Dirhams (TTC)");
      expect(amountToWords(91)).toBe("Quatre-Vingt-Onze Dirhams (TTC)");
      expect(amountToWords(95)).toBe("Quatre-Vingt-Quinze Dirhams (TTC)");
      expect(amountToWords(99)).toBe("Quatre-Vingt-Dix-Neuf Dirhams (TTC)");
    });
  });

  describe("Hundreds (100-999)", () => {
    it("should convert exact hundreds", () => {
      expect(amountToWords(100)).toBe("Cent Dirhams (TTC)");
      expect(amountToWords(200)).toBe("Deux Cents Dirhams (TTC)");
      expect(amountToWords(300)).toBe("Trois Cents Dirhams (TTC)");
      expect(amountToWords(900)).toBe("Neuf Cents Dirhams (TTC)");
    });

    it("should not pluralize 'cent' when followed by units", () => {
      expect(amountToWords(201)).toBe("Deux Cent Un Dirhams (TTC)");
      expect(amountToWords(305)).toBe("Trois Cent Cinq Dirhams (TTC)");
      expect(amountToWords(999)).toBe(
        "Neuf Cent Quatre-Vingt-Dix-Neuf Dirhams (TTC)"
      );
    });

    it("should handle hundreds with tens", () => {
      expect(amountToWords(150)).toBe("Cent Cinquante Dirhams (TTC)");
      expect(amountToWords(275)).toBe(
        "Deux Cent Soixante-Quinze Dirhams (TTC)"
      );
      expect(amountToWords(399)).toBe(
        "Trois Cent Quatre-Vingt-Dix-Neuf Dirhams (TTC)"
      );
    });
  });

  describe("Thousands (1,000-999,999)", () => {
    it("should convert exact thousands", () => {
      expect(amountToWords(1000)).toBe("Mille Dirhams (TTC)");
      expect(amountToWords(2000)).toBe("Deux Mille Dirhams (TTC)");
      expect(amountToWords(5000)).toBe("Cinq Mille Dirhams (TTC)");
      expect(amountToWords(10000)).toBe("Dix Mille Dirhams (TTC)");
    });

    it("should handle thousands with hundreds", () => {
      expect(amountToWords(1200)).toBe("Mille Deux Cent Dirhams (TTC)");
      expect(amountToWords(7200)).toBe("Sept Mille Deux Cent Dirhams (TTC)");
      expect(amountToWords(50500)).toBe(
        "Cinquante Mille Cinq Cent Dirhams (TTC)"
      );
    });

    it("should handle complex thousands", () => {
      expect(amountToWords(1234)).toBe(
        "Mille Deux Cent Trente-Quatre Dirhams (TTC)"
      );
      expect(amountToWords(9999)).toBe(
        "Neuf Mille Neuf Cent Quatre-Vingt-Dix-Neuf Dirhams (TTC)"
      );
      expect(amountToWords(50075)).toBe(
        "Cinquante Mille Soixante-Quinze Dirhams (TTC)"
      );
      expect(amountToWords(999999)).toBe(
        "Neuf Cent Quatre-Vingt-Dix-Neuf Mille Neuf Cent Quatre-Vingt-Dix-Neuf Dirhams (TTC)"
      );
    });
  });

  describe("Real-World Invoice Amounts", () => {
    it("should convert typical gym membership amounts", () => {
      expect(amountToWords(300)).toBe("Trois Cents Dirhams (TTC)");
      expect(amountToWords(500)).toBe("Cinq Cents Dirhams (TTC)");
      expect(amountToWords(1200)).toBe("Mille Deux Cent Dirhams (TTC)");
      expect(amountToWords(3600)).toBe("Trois Mille Six Cent Dirhams (TTC)");
      expect(amountToWords(7200)).toBe("Sept Mille Deux Cent Dirhams (TTC)");
    });

    it("should handle amounts with decimals (centimes)", () => {
      expect(amountToWords(299.99)).toBe(
        "Deux Cent Quatre-Vingt-Dix-Neuf Dirhams et Quatre-Vingt-Dix-Neuf Centimes (TTC)"
      );
      expect(amountToWords(1199.5)).toBe(
        "Mille Cent Quatre-Vingt-Dix-Neuf Dirhams et Cinquante Centimes (TTC)"
      );
      expect(amountToWords(7200.01)).toBe(
        "Sept Mille Deux Cent Dirhams et Un Centimes (TTC)"
      );
    });
  });

  describe("Custom Currency", () => {
    it("should accept custom currency name", () => {
      expect(amountToWords(100, "Euros")).toBe("Cent Euros (TTC)");
      expect(amountToWords(7200, "Dollars")).toBe(
        "Sept Mille Deux Cent Dollars (TTC)"
      );
    });
  });
});

describe("formatInvoiceAmount", () => {
  it("should format amount for invoice with default currency", () => {
    expect(formatInvoiceAmount(0)).toBe("Zéro Dirhams (TTC)");
    expect(formatInvoiceAmount(100)).toBe("Cent Dirhams (TTC)");
    expect(formatInvoiceAmount(7200)).toBe(
      "Sept Mille Deux Cent Dirhams (TTC)"
    );
  });

  it("should handle decimal amounts with centimes", () => {
    expect(formatInvoiceAmount(7200.5)).toBe(
      "Sept Mille Deux Cent Dirhams et Cinquante Centimes (TTC)"
    );
    expect(formatInvoiceAmount(2236.43)).toBe(
      "Deux Mille Deux Cent Trente-Six Dirhams et Quarante-Trois Centimes (TTC)"
    );
  });
});
