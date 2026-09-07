import { defineCommandMenuItem } from 'twenty-sdk/define';

import {
  SEND_ZALO_MESSAGE_COMMAND_UNIVERSAL_IDENTIFIER,
  SEND_ZALO_MESSAGE_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineCommandMenuItem({
  universalIdentifier: SEND_ZALO_MESSAGE_COMMAND_UNIVERSAL_IDENTIFIER,
  label: 'Send Zalo message',
  shortLabel: 'Zalo message',
  icon: 'IconBrandTelegram',
  isPinned: false,
  availabilityType: 'GLOBAL',
  frontComponentUniversalIdentifier:
    SEND_ZALO_MESSAGE_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
});
