import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  ORDER_ITEM_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_ITEM_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_ITEM_QUANTITY_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_ITEM_UNIT_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineObject({
  universalIdentifier: ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'orderItem',
  namePlural: 'orderItems',
  labelSingular: 'Order Item',
  labelPlural: 'Order Items',
  description: 'Line items belonging to an order',
  icon: 'IconReceipt',
  labelIdentifierFieldMetadataUniversalIdentifier:
    ORDER_ITEM_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: ORDER_ITEM_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Item Description',
      description: 'Product or service name snapshot',
      icon: 'IconTag',
    },
    {
      universalIdentifier: ORDER_ITEM_QUANTITY_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.NUMBER,
      name: 'quantity',
      label: 'Quantity',
      icon: 'IconNumber',
      defaultValue: 1,
    },
    {
      universalIdentifier: ORDER_ITEM_UNIT_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'unitPrice',
      label: 'Unit Price',
      icon: 'IconCoin',
      isNullable: true,
    },
    {
      universalIdentifier: ORDER_ITEM_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'amount',
      label: 'Total Line Amount',
      description: 'Quantity multiplied by unit price',
      icon: 'IconCalculator',
      isNullable: true,
    },
  ],
});
