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

const ORDER_CURRENCY_CODE = 'VND';
const MICROS_PER_UNIT = 1_000_000;

// amountMicros is a GraphQL Int. Rounding has to happen here rather than in the
// float arithmetic upstream of it, or a fractional price produces 300000.00000000006.
const toAmountMicros = (amount: number): number =>
  Math.round(amount * MICROS_PER_UNIT);

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

  // Reject before any write: recalculateOrderTotals clamps quantity to >= 1 and
  // unitPrice to >= 0, which would silently bill a different order than the caller sent.
  const invalidItem = items.find(
    (item) =>
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0,
  );

  if (isDefined(invalidItem)) {
    return {
      success: false,
      message: 'Failed to create order',
      error: `Invalid line item "${invalidItem.name}": quantity must be a positive finite number and unitPrice a non-negative finite number.`,
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
      amountMicros: toAmountMicros(calculation.totalAmount),
      currencyCode: ORDER_CURRENCY_CODE,
    },
    discountAmount: {
      amountMicros: toAmountMicros(calculation.discountAmount),
      currencyCode: ORDER_CURRENCY_CODE,
    },
    remainingAmount: {
      amountMicros: toAmountMicros(calculation.remainingAmount),
      currencyCode: ORDER_CURRENCY_CODE,
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

  let createdOrderId: string | undefined;
  let createdItemCount = 0;

  try {
    const createdOrder = (await coreClient.mutation({
      createOrder: {
        __args: {
          data: orderData,
        },
        id: true,
      },
    })) as { createOrder?: { id: string } };

    createdOrderId = createdOrder.createOrder?.id;

    if (!isDefined(createdOrderId)) {
      return {
        success: false,
        message: 'Failed to create order',
        error: 'No order ID returned by CRM mutation.',
      };
    }

    const orderId = createdOrderId;

    // Create line items linked to order
    for (const item of calculation.items) {
      const lineData: Record<string, unknown> = {
        name: item.name,
        quantity: item.quantity,
        unitPrice: {
          amountMicros: toAmountMicros(item.unitPrice),
          currencyCode: ORDER_CURRENCY_CODE,
        },
        amount: {
          amountMicros: toAmountMicros(item.amount),
          currencyCode: ORDER_CURRENCY_CODE,
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

      createdItemCount++;
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
    // The order row is written before its items, so a mid-loop failure leaves a
    // persisted order whose totals assume line items that do not exist. There is
    // no compensating delete yet, so report exactly what landed instead of hiding it.
    const isPartial = isDefined(createdOrderId);

    return {
      success: false,
      message: isPartial
        ? `Order ${generatedCode} was created but is INCONSISTENT: ${createdItemCount}/${calculation.items.length} line item(s) written. Review or delete order ${createdOrderId}.`
        : 'Failed to create order in CRM',
      error: error instanceof Error ? error.message : String(error),
      orderId: createdOrderId,
      orderCode: isPartial ? generatedCode : undefined,
    };
  }
};
