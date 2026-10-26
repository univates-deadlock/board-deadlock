import { describe, expect, it } from "vitest";
import { calcItemSubtotal, calcQuoteTotals, toDecimal } from "../src/services/quote.calculations.js";

describe("quote item calculations", () => {
  it.each([
    ["4", "250.50", "20", "982"],
    ["0.25", "0.10", "0", "0.03"],
    ["1", "10", "10", "0"],
    ["1", "0", "0", "0"],
    ["1", "9999999999.99", "0", "9999999999.99"],
    ["2", "6000000000", "3000000000", "9000000000"],
  ])("calculates quantity %s × price %s − discount %s as %s", (quantity, unitPrice, discount, expected) => {
    expect(calcItemSubtotal({
      quantity: toDecimal(quantity), unitPrice: toDecimal(unitPrice), discount: toDecimal(discount),
    }).toString()).toBe(expected);
  });

  it("rejects a discount above the rounded gross amount", () => {
    expect(() => calcItemSubtotal({
      quantity: toDecimal(1), unitPrice: toDecimal(10), discount: toDecimal("10.01"),
    })).toThrow(expect.objectContaining({ statusCode: 422 }));
  });

  it("rejects an item subtotal above Decimal(12, 2)", () => {
    expect(() => calcItemSubtotal({
      quantity: toDecimal(2), unitPrice: toDecimal(6_000_000_000), discount: toDecimal(0),
    })).toThrow(expect.objectContaining({ statusCode: 422 }));
  });
});

describe("quote totals", () => {
  it.each([
    [[], "0", "0", "0"],
    [["0.1", "0.2"], "0", "0.3", "0.3"],
    [["982", "400"], "50", "1382", "1332"],
    [["10"], "10", "10", "0"],
    [["9999999999.99"], "0", "9999999999.99", "9999999999.99"],
  ])("calculates %j with discount %s", (items, discount, subtotal, total) => {
    const result = calcQuoteTotals(items.map(toDecimal), toDecimal(discount));
    expect(result.subtotal.toString()).toBe(subtotal);
    expect(result.discount.toString()).toBe(discount);
    expect(result.total.toString()).toBe(total);
  });

  it("rejects an overall discount above the subtotal", () => {
    expect(() => calcQuoteTotals([toDecimal(10)], toDecimal(11)))
      .toThrow(expect.objectContaining({ statusCode: 422 }));
  });

  it("rejects summed subtotals above Decimal(12, 2), even with a discount", () => {
    expect(() => calcQuoteTotals([toDecimal(6_000_000_000), toDecimal(6_000_000_000)], toDecimal(3_000_000_000)))
      .toThrow(expect.objectContaining({ statusCode: 422 }));
  });
});
