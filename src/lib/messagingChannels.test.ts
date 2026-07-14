import { describe, expect, it } from 'vitest';
import { messagingChannels } from '@/lib/messagingChannels';

describe('messagingChannels', () => {
  it('keeps chat and SMS as separate primary channels', () => {
    expect(messagingChannels.inAppChat.path).toBe('/admin-chat-management');
    expect(messagingChannels.customerSms.path).toBe('/admin-sms-messages');
    expect(messagingChannels.inAppChat.path).not.toBe(messagingChannels.customerSms.path);
  });

  it('labels channels so staff can tell portal chat from phone SMS', () => {
    expect(messagingChannels.inAppChat.label).toMatch(/In-app/i);
    expect(messagingChannels.customerSms.label).toMatch(/SMS/i);
  });
});
