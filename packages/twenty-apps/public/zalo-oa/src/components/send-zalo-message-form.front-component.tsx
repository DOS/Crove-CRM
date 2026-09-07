import { useState } from 'react';
import { defineFrontComponent } from 'twenty-sdk/define';
import {
  closeSidePanel,
  enqueueSnackbar,
  unmountFrontComponent,
} from 'twenty-sdk/front-component';

import { SEND_ZALO_MESSAGE_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

const ZALO_MESSAGE_MAX_LENGTH = 2000;

const readSerializedValue = (
  e: React.SyntheticEvent<HTMLElement>,
): string | undefined => {
  const obj = e as {
    detail?: { value?: string };
    value?: string;
    target?: { value?: string };
  };

  if (typeof obj.detail?.value === 'string') return obj.detail.value;
  if (typeof obj.value === 'string') return obj.value;
  if (typeof obj.target?.value === 'string') return obj.target.value;

  return undefined;
};

const onValueChange =
  (fn: (value: string) => void) => (e: React.SyntheticEvent<HTMLElement>) => {
    const value = readSerializedValue(e);

    if (typeof value === 'string') fn(value);
  };

const callAppRoute = async (
  path: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>,
) => {
  const apiBaseUrl = process.env.TWENTY_API_URL;
  const token =
    process.env.TWENTY_APP_ACCESS_TOKEN ?? process.env.TWENTY_API_KEY;

  if (!apiBaseUrl || !token) {
    throw new Error('API configuration missing');
  }

  const response = await fetch(`${apiBaseUrl}/s${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');

    throw new Error(
      `Request failed (${response.status}): ${text.slice(0, 200)}`,
    );
  }

  return response.json();
};

const COLOR = {
  bg: '#f1f1f1',
  card: '#ffffff',
  surface: '#fcfcfc',
  border: '#ebebeb',
  borderStrong: '#d6d6d6',
  text: '#333333',
  textSecondary: '#666666',
  textTertiary: '#999999',
  accent: '#0068FF',
  error: '#e05252',
};

const STYLES = {
  outer: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    backgroundColor: COLOR.bg,
    padding: '12px',
    height: '100%',
    boxSizing: 'border-box' as const,
  },
  container: {
    backgroundColor: COLOR.card,
    borderRadius: '8px',
    border: `1px solid ${COLOR.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    boxSizing: 'border-box' as const,
    color: COLOR.text,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: `1px solid ${COLOR.border}`,
    fontWeight: 600,
    fontSize: '13px',
    color: COLOR.accent,
  },
  inputSection: {
    padding: '12px 14px',
    borderBottom: `1px solid ${COLOR.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    color: COLOR.textSecondary,
    fontWeight: 500,
  },
  input: {
    backgroundColor: COLOR.surface,
    border: `1px solid ${COLOR.border}`,
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    outline: 'none',
    color: COLOR.text,
    fontFamily: 'inherit',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '14px',
    overflow: 'auto',
    minHeight: 0,
    gap: '6px',
  },
  textarea: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: COLOR.text,
    fontSize: '13px',
    fontFamily: 'inherit',
    width: '100%',
    padding: 0,
    resize: 'none' as const,
    flex: 1,
    minHeight: '120px',
  },
  charCount: {
    fontSize: '11px',
    textAlign: 'right' as const,
    color: COLOR.textTertiary,
    flexShrink: 0,
  },
  actionBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '8px 12px',
    borderTop: `1px solid ${COLOR.border}`,
    flexShrink: 0,
  },
  cancelButton: {
    background: 'transparent',
    border: 'none',
    color: COLOR.textSecondary,
    fontSize: '12px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  sendButton: {
    background: COLOR.accent,
    border: 'none',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    padding: '6px 16px',
    borderRadius: '6px',
  },
  sendButtonDisabled: {
    background: COLOR.borderStrong,
    color: COLOR.textTertiary,
    cursor: 'not-allowed',
  },
};

const SendZaloMessageForm = () => {
  const [userId, setUserId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleCancel = () => {
    unmountFrontComponent();
    closeSidePanel();
  };

  const handleSubmit = async () => {
    const trimmedUser = userId.trim();
    const trimmedMessage = messageText.trim();

    if (!trimmedUser || !trimmedMessage || sending) {
      return;
    }

    setSending(true);

    try {
      const result = await callAppRoute('/zalo/messages', 'POST', {
        userId: trimmedUser,
        messageText: trimmedMessage,
      });

      if (!result.success) {
        await enqueueSnackbar({
          message: result.error ?? 'Failed to send Zalo message',
          variant: 'error',
        });
        setSending(false);

        return;
      }

      setSentSuccess(true);
      await enqueueSnackbar({
        message: 'Zalo message sent successfully!',
        variant: 'success',
      });
    } catch (error) {
      await enqueueSnackbar({
        message:
          error instanceof Error ? error.message : 'Failed to send message',
        variant: 'error',
      });
      setSending(false);
    }
  };

  if (sentSuccess) {
    return (
      <div style={STYLES.outer}>
        <div
          style={{
            ...STYLES.container,
            padding: '24px',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#2ea043',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '16px',
            }}
          >
            ✓
          </div>
          <div style={{ fontWeight: 600 }}>Message sent to Zalo user!</div>
          <button
            type="button"
            style={STYLES.cancelButton}
            onClick={handleCancel}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const canSubmit =
    userId.trim().length > 0 &&
    messageText.trim().length > 0 &&
    messageText.length <= ZALO_MESSAGE_MAX_LENGTH &&
    !sending;

  return (
    <div style={STYLES.outer}>
      <div style={STYLES.container}>
        <div style={STYLES.header}>Send Zalo Message (OA)</div>

        <div style={STYLES.inputSection}>
          <label style={STYLES.label}>Recipient Zalo User ID</label>
          <input
            type="text"
            placeholder="e.g. 1234567890123456789"
            value={userId}
            onChange={onValueChange(setUserId)}
            style={STYLES.input}
          />
        </div>

        <div style={STYLES.body}>
          <textarea
            placeholder="Type your message to customer..."
            value={messageText}
            onChange={onValueChange(setMessageText)}
            style={STYLES.textarea}
          />
          <div style={STYLES.charCount}>
            {messageText.length} / {ZALO_MESSAGE_MAX_LENGTH}
          </div>
        </div>

        <div style={STYLES.actionBar}>
          <button
            type="button"
            style={STYLES.cancelButton}
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            style={{
              ...STYLES.sendButton,
              ...(!canSubmit ? STYLES.sendButtonDisabled : {}),
            }}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default defineFrontComponent({
  universalIdentifier:
    SEND_ZALO_MESSAGE_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER,
  name: 'send-zalo-message-form',
  description:
    'Form to send a 1-on-1 customer support message to a customer via Zalo Official Account.',
  component: SendZaloMessageForm,
});
