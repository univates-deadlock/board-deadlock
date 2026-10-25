import { Prisma } from "../../generated/prisma/client.js";
import { AppError } from "../utils/AppError.js";

// Calculations always use Decimal (never float), rounded to 2 decimal places.
// Pure functions: they don't access the database, so they're easy to test.

type Money = Prisma.Decimal;

export const toDecimal = (value: number | string | Money): Money => new Prisma.Decimal(value);

// All persisted monetary fields use Decimal(12, 2).
const MAX_STORED_AMOUNT = toDecimal("9999999999.99");

const round2 = (value: Money): Money =>
  value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

// Item subtotal = (quantity × unit price) − item discount.
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

  const subtotal = gross.sub(params.discount);

  if (subtotal.gt(MAX_STORED_AMOUNT)) {
    throw new AppError("O subtotal do item excede o limite de R$ 9.999.999.999,99", 422);
  }

  return subtotal;
};

// Quote subtotal = sum of the items; total = subtotal − overall discount.
export const calcQuoteTotals = (
  itemSubtotals: Money[],
  discount: Money
): { subtotal: Money; discount: Money; total: Money } => {
  const subtotal = round2(itemSubtotals.reduce((sum, value) => sum.add(value), toDecimal(0)));

  if (subtotal.gt(MAX_STORED_AMOUNT)) {
    throw new AppError("O subtotal do orçamento excede o limite de R$ 9.999.999.999,99", 422);
  }

  if (discount.gt(subtotal)) {
    throw new AppError("O desconto geral não pode ser maior que o subtotal do orçamento", 422);
  }

  // A nonnegative discount keeps the total within the validated subtotal's limit.
  return { subtotal, discount, total: subtotal.sub(discount) };
};
