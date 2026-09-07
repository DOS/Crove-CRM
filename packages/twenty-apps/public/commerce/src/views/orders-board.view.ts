import { defineView, ViewType } from 'twenty-sdk/define';

import {
  CUSTOMER_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDER_REMAINING_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  ORDER_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ORDERS_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OrderStatus } from 'src/objects/order.object';

const GROUP_IDS = [
  '91919191-9191-4191-8191-919191919191',
  '92929292-9292-4292-8292-929292929292',
  '93939393-9393-4393-8393-939393939393',
  '94949494-9494-4494-8494-949494949494',
];

const ORDER_STATUS_VALUES = [
  OrderStatus.NEW,
  OrderStatus.PROCESSING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

export default defineView({
  universalIdentifier: ORDERS_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Orders Board',
  objectUniversalIdentifier: ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier:
    ORDER_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: 'ffffffff-c5c5-4c5c-8c5c-ffffffffffff',
      fieldMetadataUniversalIdentifier: ORDER_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '10101010-d6d6-4d6d-8d6d-101010101010',
      fieldMetadataUniversalIdentifier:
        CUSTOMER_ON_ORDER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: '20202020-e7e7-4e7e-8e7e-202020202020',
      fieldMetadataUniversalIdentifier:
        ORDER_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: '30303030-f8f8-4f8f-8f8f-303030303030',
      fieldMetadataUniversalIdentifier:
        ORDER_REMAINING_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 140,
    },
  ],
  groups: ORDER_STATUS_VALUES.map((statusValue, index) => ({
    universalIdentifier: GROUP_IDS[index],
    fieldValue: statusValue,
    position: index,
    isVisible: true,
  })),
});
