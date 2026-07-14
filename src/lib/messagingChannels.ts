export const messagingChannels = {
  inAppChat: {
    label: 'In-app Chat',
    path: '/admin-chat-management',
    audience: 'staff ↔ customers/cleaners inside the account portal',
  },
  customerSms: {
    label: 'Customer SMS',
    path: '/admin-sms-messages',
    audience: 'staff ↔ customers via phone SMS (Twilio)',
  },
} as const;

export type MessagingChannelKey = keyof typeof messagingChannels;
