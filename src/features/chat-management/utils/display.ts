import type { ChatTypeFilter } from '../types';

export function getChatTypeDisplay(chatType: string) {
  switch (chatType) {
    case 'customer_office':
      return 'Customer ↔ Office';
    case 'customer_cleaner':
      return 'Customer ↔ Cleaner';
    case 'office_cleaner':
      return 'Office ↔ Cleaner';
    default:
      return chatType;
  }
}

export function getManagementTitle(selectedChatType: ChatTypeFilter) {
  switch (selectedChatType) {
    case 'all':
      return 'All conversations';
    case 'active':
      return 'Active conversations';
    case 'customer_office':
      return 'Customer ↔ Office';
    case 'customer_cleaner':
      return 'Customer ↔ Cleaner';
    case 'office_cleaner':
      return 'Office ↔ Cleaner';
    default:
      return 'All conversations';
  }
}

export function getSenderLabel(senderType: string) {
  switch (senderType) {
    case 'customer':
      return 'Customer';
    case 'cleaner':
      return 'Cleaner';
    default:
      return 'Office';
  }
}
