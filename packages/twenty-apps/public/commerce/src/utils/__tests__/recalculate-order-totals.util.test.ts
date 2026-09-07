import { describe, expect, it } from 'vitest';

import { recalculateOrderTotals } from 'src/utils/recalculate-order-totals.util';

describe('recalculateOrderTotals', () => {
  it('calculates order line items and totals accurately', () => {
    const result = recalculateOrderTotals({
      items: [
        { name: 'Gói Chăm sóc Da Chuyên sâu', quantity: 2, unitPrice: 500000 },
        { name: 'Kem Dưỡng Ẩm Cao Cấp', quantity: 1, unitPrice: 350000 },
      ],
      discountAmount: 100000,
    });

    expect(result.totalAmount).toBe(1350000);
    expect(result.discountAmount).toBe(100000);
    expect(result.remainingAmount).toBe(1250000);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].amount).toBe(1000000);
    expect(result.items[1].amount).toBe(350000);
  });

  it('handles empty items and zero values safely', () => {
    const result = recalculateOrderTotals({
      items: [],
      discountAmount: 50000,
    });

    expect(result.totalAmount).toBe(0);
    expect(result.discountAmount).toBe(50000);
    expect(result.remainingAmount).toBe(0);
  });

  it('clamps discount greater than total to 0 remaining balance', () => {
    const result = recalculateOrderTotals({
      items: [{ name: 'Dịch vụ tư vấn', quantity: 1, unitPrice: 200000 }],
      discountAmount: 300000,
    });

    expect(result.totalAmount).toBe(200000);
    expect(result.remainingAmount).toBe(0);
  });
});
