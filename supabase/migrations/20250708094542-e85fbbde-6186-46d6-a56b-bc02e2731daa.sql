-- Delete chats that have no messages
DELETE FROM public.chats 
WHERE id NOT IN (
  SELECT DISTINCT chat_id 
  FROM public.chat_messages 
  WHERE is_deleted = false
);