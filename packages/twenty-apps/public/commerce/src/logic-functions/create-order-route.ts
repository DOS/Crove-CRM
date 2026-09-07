import { defineLogicFunction, type RoutePayload } from 'twenty-sdk/define';

import { CREATE_ORDER_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  type CreateOrderInput,
  createOrderHandler,
} from 'src/logic-functions/handlers/create-order-handler';

const handler = async (event: RoutePayload) => {
  const body = event.body as CreateOrderInput | null;

  if (!body || !Array.isArray(body.items)) {
    return {
      success: false,
      message: 'Invalid order payload',
      error: '`items` array is required.',
    };
  }

  return createOrderHandler(body);
};

export default defineLogicFunction({
  universalIdentifier: CREATE_ORDER_ROUTE_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'create-order-route',
  description:
    'REST endpoint to create customer orders and line items from external systems.',
  timeoutSeconds: 30,
  handler,
  httpRouteTriggerSettings: {
    path: '/commerce/orders',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
