import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
  PRODUCTS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineNavigationMenuItem({
  universalIdentifier: PRODUCTS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  position: 10,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: PRODUCT_OBJECT_UNIVERSAL_IDENTIFIER,
});
