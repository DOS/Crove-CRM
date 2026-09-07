import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_ORDERS_VIEW_UNIVERSAL_IDENTIFIER,
  CUSTOMER_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_DISCOUNT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_REMAINING_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_ORDERS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Orders',
  objectUniversalIdentifier: ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconShoppingCart',
  position: 0,
  fields: [
    {
      universalIdentifier: '88888888-b8b8-4b8b-8b8b-888888888888',
      fieldMetadataUniversalIdentifier: ORDER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: '99999999-c9c9-4c9c-8c9c-999999999999',
      fieldMetadataUniversalIdentifier:
        CUSTOMER_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: 'aaaaaaaa-d0d0-4d0d-8d0d-aaaaaaaaaaaa',
      fieldMetadataUniversalIdentifier:
        ORDER_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'bbbbbbbb-e1e1-4e1e-8e1e-bbbbbbbbbbbb',
      fieldMetadataUniversalIdentifier:
        ORDER_DISCOUNT_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: 'cccccccc-f2f2-4f2f-8f2f-cccccccccccc',
      fieldMetadataUniversalIdentifier:
        ORDER_REMAINING_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: 'dddddddd-a3a3-4a3a-8a3a-dddddddddddd',
      fieldMetadataUniversalIdentifier: ORDER_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: 'eeeeeeee-b4b4-4b4b-8b4b-eeeeeeeeeeee',
      fieldMetadataUniversalIdentifier: ORDER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 130,
    },
  ],
});
