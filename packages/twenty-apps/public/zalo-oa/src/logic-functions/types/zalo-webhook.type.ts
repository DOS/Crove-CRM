export type ZaloWebhookPayload = {
  app_id?: string;
  oa_id?: string;
  user_id_by_app?: string;
  event_name:
    | 'follow'
    | 'unfollow'
    | 'user_send_text'
    | 'user_send_image'
    | 'user_submit_form'
    | string;
  timestamp?: string | number;
  sender?: {
    id: string;
  };
  recipient?: {
    id: string;
  };
  message?: {
    text?: string;
    msg_id?: string;
  };
  info?: {
    name?: string;
    phone?: string;
    address?: string;
  };
};

export type ZaloWebhookResult = {
  success: boolean;
  message: string;
  action?: 'created_lead' | 'updated_lead' | 'ignored';
  personId?: string;
  error?: string;
};
