import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

// Calculations always use Decimal (never float), rounded to 2 decimal places.
// Pure functions: they don't access the database, so they're easy to test.

type Money = Prisma.Decimal;

export const toDecimal = (value: number | string | Money): Money => new Prisma.Decimal(value);

const round2 = (value: Money): Money =>
  value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

//item subtotal = (quantity × unit price) − item discount
export const calcItemSubtotal = (params: {
  quantity: Money;
  unitPrice: Money;
  discount: Money;
}): Money => {
  const gross = round2(params.quantity.mul(params.unitPrice));

  if (params.discount.gt(gross)) {
    throw new AppError(
      "O desconto do item não pode ser maior que quantidade × valor unitário",
      422
    );
  }

  return gross.sub(params.discount);
};

// quote subtotal = sum of the items; total = subtotal − overall discount
export const calcQuoteTotals = (
  itemSubtotals: Money[],
  discount: Money
): { subtotal: Money; discount: Money; total: Money } => {
  const subtotal = round2(itemSubtotals.reduce((sum, value) => sum.add(value), toDecimal(0)));

  if (discount.gt(subtotal)) {
    throw new AppError("O desconto geral não pode ser maior que o subtotal do orçamento", 422);
  }

  return { subtotal, discount, total: subtotal.sub(discount) };
};