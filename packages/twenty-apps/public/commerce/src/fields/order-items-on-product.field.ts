import { defineField, FieldType, RelationType } from 'twenty-sdk/define';

import {
  ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_ITEMS_ON_PRODUCT_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  PRODUCT_ON_ORDER_ITEM_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: ORDER_ITEMS_ON_PRODUCT_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'orderItems',
  label: 'Order Items',
  icon: 'IconReceipt',
  relationTargetObjectMetadataUniversalIdentifier:
    ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    PRODUCT_ON_ORDER_ITEM_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
