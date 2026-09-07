import { isDefined } from 'src/utils/is-defined';

export type OrderItemCalculationInput = {
  name: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
};

export type OrderItemCalculationResult = {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  productId?: string;
};

export type OrderTotalsCalculationResult = {
  totalAmount: number;
  discountAmount: number;
  remainingAmount: number;
  items: OrderItemCalculationResult[];
};

export const recalculateOrderTotals = ({
  items,
  discountAmount = 0,
}: {
  items: OrderItemCalculationInput[];
  discountAmount?: number;
}): OrderTotalsCalculationResult => {
  let computedTotal = 0;

  const computedItems: OrderItemCalculationResult[] = items.map((item) => {
    const qty = Math.max(1, item.quantity || 1);
    const price = Math.max(0, item.unitPrice || 0);
    const lineAmount = qty * price;

    computedTotal += lineAmount;

    return {
      name: item.name,
      quantity: qty,
      unitPrice: price,
      amount: lineAmount,
      productId: item.productId,
    };
  });

  const normalizedDiscount = Math.max(
    0,
    isDefined(discountAmount) ? discountAmount : 0,
  );
  const remaining = Math.max(0, computedTotal - normalizedDiscount);

  return {
    totalAmount: computedTotal,
    discountAmount: normalizedDiscount,
    remainingAmount: remaining,
    items: computedItems,
  };
};
