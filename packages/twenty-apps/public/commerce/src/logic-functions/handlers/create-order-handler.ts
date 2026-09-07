import { CoreApiClient } from 'twenty-client-sdk/core';
import { isDefined } from 'src/utils/is-defined';

import {
  type OrderItemCalculationInput,
  recalculateOrderTotals,
} from 'src/utils/recalculate-order-totals.util';

export type CreateOrderInput = {
  orderCode?: string;
  customerId?: string;
  assignedToId?: string;
  discountAmount?: number;
  orderSource?: string;
  status?: string;
  notes?: string;
  items: OrderItemCalculationInput[];
};

export type CreateOrderResult = {
  success: boolean;
  message: string;
  orderId?: string;
  orderCode?: string;
  totalAmount?: number;
  remainingAmount?: number;
  error?: string;
};

export const createOrderHandler = async (
  input: CreateOrderInput,
  client?: CoreApiClient,
): Promise<CreateOrderResult> => {
  const items = input.items ?? [];

  if (items.length === 0) {
    return {
      success: false,
      message: 'Failed to create order',
      error: 'At least one order item is required.',
    };
  }

  const coreClient = client ?? new CoreApiClient();

  const generatedCode =
    input.orderCode ??
    `OD${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
  const calculation = recalculateOrderTotals({
    items,
    discountAmount: input.discountAmount ?? 0,
  });

  const orderData: Record<string, unknown> = {
    name: generatedCode,
    totalAmount: {
      amountMicros: calculation.totalAmount * 1_000_000,
      currencyCode: 'VND',
    },
    discountAmount: {
      amountMicros: calculation.discountAmount * 1_000_000,
      currencyCode: 'VND',
    },
    remainingAmount: {
      amountMicros: calculation.remainingAmount * 1_000_000,
      currencyCode: 'VND',
    },
    orderSource: input.orderSource ?? 'WEBSITE',
    status: input.status ?? 'NEW',
    notes: input.notes,
  };

  if (isDefined(input.customerId) && input.customerId.trim().length > 0) {
    orderData.customerId = input.customerId.trim();
  }

  if (isDefined(input.assignedToId) && input.assignedToId.trim().length > 0) {
    orderData.assignedToId = input.assignedToId.trim();
  }

  try {
    const createdOrder = (await coreClient.mutation({
      createOrder: {
        __args: {
          data: orderData,
        },
        id: true,
      },
    })) as { createOrder?: { id: string } };

    const orderId = createdOrder.createOrder?.id;

    if (!isDefined(orderId)) {
      return {
        success: false,
        message: 'Failed to create order',
        error: 'No order ID returned by CRM mutation.',
      };
    }

    // Create line items linked to order
    for (const item of calculation.items) {
      const lineData: Record<string, unknown> = {
        name: item.name,
        quantity: item.quantity,
        unitPrice: {
          amountMicros: item.unitPrice * 1_000_000,
          currencyCode: 'VND',
        },
        amount: {
          amountMicros: item.amount * 1_000_000,
          currencyCode: 'VND',
        },
        orderId,
      };

      if (isDefined(item.productId) && item.productId.trim().length > 0) {
        lineData.productId = item.productId.trim();
      }

      await coreClient.mutation({
        createOrderItem: {
          __args: {
            data: lineData,
          },
          id: true,
        },
      });
    }

    return {
      success: true,
      message: `Order ${generatedCode} created successfully with ${items.length} line item(s).`,
      orderId,
      orderCode: generatedCode,
      totalAmount: calculation.totalAmount,
      remainingAmount: calculation.remainingAmount,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to create order in CRM',
      error: (error as Error).message,
    };
  }
};
