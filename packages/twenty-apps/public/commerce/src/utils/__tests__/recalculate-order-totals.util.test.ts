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

  // Guards the C6 audit fix: 3 * 0.1 is 0.30000000000000004 in binary floats, and
  // the handler multiplies totals by 1e6 into a GraphQL Int, so any unrounded
  // fractional amount would make createOrder reject at runtime. Rounding happens
  // in the handler's toAmountMicros, not here, so this test asserts the util
  // preserves the value and that the rounded micros integer is exact.
  it('keeps fractional unit prices exact at the micros boundary', () => {
    const result = recalculateOrderTotals({
      items: [
        { name: 'Combo khuyến mãi', quantity: 3, unitPrice: 0.1 },
        { name: 'Dịch vụ gỡ lỗi', quantity: 7, unitPrice: 1.7 },
      ],
    });

    expect(result.items[0].amount).toBeCloseTo(0.3, 10);
    expect(result.items[1].amount).toBeCloseTo(11.9, 10);
    expect(result.totalAmount).toBeCloseTo(12.2, 10);
    expect(Math.round(result.totalAmount * 1_000_000)).toBe(12_200_000);
    expect(Math.round(result.remainingAmount * 1_000_000)).toBe(12_200_000);
  });

  // 99_999 * 123_456 = 12_345_476_544: whole-VND quantities must stay exact end
  // to end. The micros product is 1.2345476544e16 — above 2^53 but exactly
  // representable, so this documents where the float multiply stops being
  // universally safe; the C6 fix guards the fractional side that actually breaks.
  it('preserves exact integers for whole-VND totals across large quantities', () => {
    const result = recalculateOrderTotals({
      items: [{ name: 'Gói năm', quantity: 99_999, unitPrice: 123_456 }],
    });

    expect(result.totalAmount).toBe(12_345_476_544);
    expect(Math.round(result.totalAmount * 1_000_000)).toBe(
      12_345_476_544_000_000,
    );
  });
});
