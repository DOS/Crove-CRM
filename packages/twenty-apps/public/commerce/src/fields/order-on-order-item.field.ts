import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_ITEMS_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_ON_ORDER_ITEM_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier: ORDER_ON_ORDER_ITEM_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: ORDER_ITEM_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'order',
  label: 'Order',
  icon: 'IconShoppingCart',
  relationTargetObjectMetadataUniversalIdentifier:
    ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ORDER_ITEMS_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.CASCADE,
    joinColumnName: 'orderId',
  },
});
