import { defineLogicFunction } from 'twenty-sdk/define';

import { RECALCULATE_ORDER_TOTALS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { calculateOrderTotalsHandler } from 'src/logic-functions/handlers/calculate-order-totals-handler';

export default defineLogicFunction({
  universalIdentifier:
    RECALCULATE_ORDER_TOTALS_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'calculate-order-totals',
  description:
    'Computes total order amounts, discounts, remaining balance, and item line subtotals.',
  timeoutSeconds: 30,
  workflowActionTriggerSettings: {
    label: 'Calculate Order Totals',
    icon: 'IconCalculator',
    inputSchema: [
      {
        type: 'array',
        label: 'Order Items',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number' },
            unitPrice: { type: 'number' },
          },
        },
      },
      {
        type: 'number',
        label: 'Discount Amount',
      },
    ],
    outputSchema: [
      {
        type: 'object',
        properties: {
          totalAmount: { type: 'number' },
          discountAmount: { type: 'number' },
          remainingAmount: { type: 'number' },
        },
      },
    ],
  },
  handler: calculateOrderTotalsHandler,
});
