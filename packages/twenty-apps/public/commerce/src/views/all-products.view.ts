import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_PRODUCTS_VIEW_UNIVERSAL_IDENTIFIER,
  PRODUCT_DURATION_MINUTES_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  PRODUCT_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_SKU_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_STOCK_QUANTITY_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineView({
  universalIdentifier: ALL_PRODUCTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Products & Services',
  objectUniversalIdentifier: PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconPackage',
  position: 0,
  fields: [
    {
      universalIdentifier: '11111111-a1a1-4a1a-8a1a-111111111111',
      fieldMetadataUniversalIdentifier: PRODUCT_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 240,
    },
    {
      universalIdentifier: '22222222-b2b2-4b2b-8b2b-222222222222',
      fieldMetadataUniversalIdentifier: PRODUCT_SKU_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 130,
    },
    {
      universalIdentifier: '33333333-c3c3-4c3c-8c3c-333333333333',
      fieldMetadataUniversalIdentifier: PRODUCT_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '44444444-d4d4-4d4d-8d4d-444444444444',
      fieldMetadataUniversalIdentifier:
        PRODUCT_PRICE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '55555555-e5e5-4e5e-8e5e-555555555555',
      fieldMetadataUniversalIdentifier:
        PRODUCT_DURATION_MINUTES_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '66666666-f6f6-4f6f-8f6f-666666666666',
      fieldMetadataUniversalIdentifier:
        PRODUCT_STOCK_QUANTITY_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: '77777777-a7a7-4a7a-8a7a-777777777777',
      fieldMetadataUniversalIdentifier:
        PRODUCT_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 120,
    },
  ],
});
