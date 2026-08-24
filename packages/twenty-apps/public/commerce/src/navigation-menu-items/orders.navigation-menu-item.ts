import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
  ORDERS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: ORDERS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  position: 11,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: ORDER_OBJECT_UNIVERSAL_IDENTIFIER,
});
