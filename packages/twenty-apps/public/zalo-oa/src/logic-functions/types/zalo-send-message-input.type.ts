export type ZaloSendMessageInput = {
  userId: string;
  messageText: string;
  accessToken?: string;
};

export type ZaloSendMessageResult = {
  success: boolean;
  message: string;
  messageId?: string;
  userId?: string;
  error?: string;
};
