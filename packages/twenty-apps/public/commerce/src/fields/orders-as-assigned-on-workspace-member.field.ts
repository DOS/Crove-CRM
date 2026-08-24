import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ASSIGNED_TO_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDERS_AS_ASSIGNED_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineField({
  universalIdentifier:
    ORDERS_AS_ASSIGNED_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'assignedOrders',
  label: 'Assigned Orders',
  icon: 'IconShoppingCart',
  relationTargetObjectMetadataUniversalIdentifier:
    ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ASSIGNED_TO_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
