import { describe, expect, it, vi } from 'vitest';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { calculateOrderTotalsHandler } from 'src/logic-functions/handlers/calculate-order-totals-handler';
import { createOrderHandler } from 'src/logic-functions/handlers/create-order-handler';

describe('calculateOrderTotalsHandler', () => {
  it('calculates totals and remaining balance correctly', async () => {
    const result = await calculateOrderTotalsHandler({
      items: [{ name: 'Sản phẩm mẫu', quantity: 3, unitPrice: 100000 }],
      discountAmount: 20000,
    });

    expect(result.totalAmount).toBe(300000);
    expect(result.discountAmount).toBe(20000);
    expect(result.remainingAmount).toBe(280000);
  });
});

describe('createOrderHandler', () => {
  it('creates order and order items via CoreApiClient', async () => {
    const mockClient = {
      mutation: vi
        .fn()
        .mockResolvedValueOnce({ createOrder: { id: 'order_test_123' } })
        .mockResolvedValueOnce({ createOrderItem: { id: 'item_1' } }),
    } as unknown as CoreApiClient;

    const result = await createOrderHandler(
      {
        orderCode: 'OD_TEST_001',
        customerId: 'person_cust_999',
        discountAmount: 50000,
        orderSource: 'WEBSITE',
        status: 'NEW',
        items: [
          {
            name: 'Liệu trình Trẻ hóa Da',
            quantity: 1,
            unitPrice: 1500000,
            productId: 'prod_99',
          },
        ],
      },
      mockClient,
    );

    expect(result.success).toBe(true);
    expect(result.orderId).toBe('order_test_123');
    expect(result.orderCode).toBe('OD_TEST_001');
    expect(result.totalAmount).toBe(1500000);
    expect(result.remainingAmount).toBe(1450000);
    expect(mockClient.mutation).toHaveBeenCalledTimes(2);
  });

  it('fails cleanly when items array is empty', async () => {
    const result = await createOrderHandler({
      items: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('At least one order item is required');
  });
});
