import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_ITEMS_ON_PRODUCT_FIELD_UNIVERSAL_IDENTIFIER,
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  PRODUCT_ON_ORDER_ITEM_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: PRODUCT_ON_ORDER_ITEM_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'product',
  label: 'Product',
  icon: 'IconPackage',
  relationTargetObjectMetadataUniversalIdentifier:
    PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ORDER_ITEMS_ON_PRODUCT_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'productId',
  },
});
