export type ZaloSendZnsInput = {
  phone: string;
  templateId: string;
  templateData: Record<string, unknown> | string;
  mode?: 'production' | 'development';
  trackingId?: string;
  accessToken?: string;
};

export type ZaloSendZnsResult = {
  success: boolean;
  message: string;
  msgId?: string;
  sentTime?: string;
  error?: string;
};
