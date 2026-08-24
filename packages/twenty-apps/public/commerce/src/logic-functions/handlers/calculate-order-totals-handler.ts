import {
  type OrderItemCalculationInput,
  type OrderTotalsCalculationResult,
  recalculateOrderTotals,
} from 'src/utils/recalculate-order-totals.util';

export type CalculateOrderTotalsInput = {
  items: OrderItemCalculationInput[];
  discountAmount?: number;
};

export const calculateOrderTotalsHandler = async (
  input: CalculateOrderTotalsInput,
): Promise<OrderTotalsCalculationResult> => {
  return recalculateOrderTotals({
    items: input.items ?? [],
    discountAmount: input.discountAmount ?? 0,
  });
};
