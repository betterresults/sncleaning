import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/hooks/useChat';
import { ShellLoading } from '@/layouts/shell';
import { ChatManagementView } from '@/features/chat-management';

const AdminChatManagement = () => {
  const { loading: authLoading } = useAuth();
  const {
    chats,
    activeChat,
    setActiveChat,
    messages,
    loading: chatLoading,
    sendingMessage,
    fetchMessages,
    sendMessage,
  } = useChat();

  if (authLoading) {
    return <ShellLoading />;
  }

  return (
    <ChatManagementView
      chats={chats}
      activeChat={activeChat}
      setActiveChat={setActiveChat}
      messages={messages}
      chatLoading={chatLoading}
      sendingMessage={sendingMessage}
      fetchMessages={fetchMessages}
      sendMessage={sendMessage}
    />
  );
};

export default AdminChatManagement;
