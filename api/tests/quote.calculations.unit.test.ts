import { describe, expect, it } from "vitest";
import {
  calcItemSubtotal,
  calcQuoteTotals,
  toDecimal,
} from "../src/services/quote.calculations.js";

describe("Quote calculations (unit)", () => {
  describe("calcItemSubtotal", () => {
    it("multiplies quantity by unit price and subtracts item discount", () => {
      // Arrange
      const quantity = toDecimal("4");
      const unitPrice = toDecimal("250.50");
      const discount = toDecimal("20.00");

      // Act
      const subtotal = calcItemSubtotal({ quantity, unitPrice, discount });

      // Assert: (4 * 250.50) - 20.00 = 1002.00 - 20.00 = 982.00
      expect(subtotal.toString()).toBe("982");
    });

    it("handles decimal precision accurately without floating-point errors", () => {
      // Arrange: 0.25 * 0.10 = 0.025, rounds half-up to 0.03
      const quantity = toDecimal("0.25");
      const unitPrice = toDecimal("0.10");
      const discount = toDecimal("0");

      // Act
      const subtotal = calcItemSubtotal({ quantity, unitPrice, discount });

      // Assert
      expect(subtotal.toString()).toBe("0.03");
    });

    it("rejects an item discount that exceeds the gross amount", () => {
      // Arrange: 1 * 10.00 = 10.00 gross, discount is 10.01
      const quantity = toDecimal("1");
      const unitPrice = toDecimal("10.00");
      const discount = toDecimal("10.01");

      // Act & Assert
      expect(() => calcItemSubtotal({ quantity, unitPrice, discount })).toThrow(
        expect.objectContaining({ statusCode: 422 })
      );
    });
  });

  describe("calcQuoteTotals", () => {
    it("sums item subtotals, applies overall discount, and calculates final total", () => {
      // Arrange
      const itemSubtotals = [toDecimal("982.00"), toDecimal("400.00")];
      const discount = toDecimal("50.00");

      // Act
      const totals = calcQuoteTotals(itemSubtotals, discount);

      // Assert: subtotal = 1382.00, discount = 50.00, total = 1332.00
      expect(totals.subtotal.toString()).toBe("1382");
      expect(totals.discount.toString()).toBe("50");
      expect(totals.total.toString()).toBe("1332");
    });

    it("rejects an overall discount that exceeds the quote subtotal", () => {
      // Arrange
      const itemSubtotals = [toDecimal("100.00")];
      const discount = toDecimal("150.00");

      // Act & Assert
      expect(() => calcQuoteTotals(itemSubtotals, discount)).toThrow(
        expect.objectContaining({ statusCode: 422 })
      );
    });
  });
});
