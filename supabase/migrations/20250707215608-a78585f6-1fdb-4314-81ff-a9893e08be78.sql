-- Function to handle chat continuity when cleaner is assigned to booking
CREATE OR REPLACE FUNCTION public.handle_cleaner_assignment_chat()
RETURNS TRIGGER AS $$
DECLARE
    existing_office_chat_id uuid;
    new_cleaner_chat_id uuid;
BEGIN
    -- Only proceed if cleaner was added (not removed or changed)
    IF OLD.cleaner IS NULL AND NEW.cleaner IS NOT NULL THEN
        -- Check if there's an existing office chat for this booking
        SELECT id INTO existing_office_chat_id
        FROM public.chats
        WHERE booking_id = NEW.id 
        AND chat_type = 'customer_office'
        AND is_active = true;

        -- If office chat exists, create a new cleaner chat and transfer context
        IF existing_office_chat_id IS NOT NULL THEN
            -- Create new customer_cleaner chat
            INSERT INTO public.chats (
                chat_type,
                customer_id,
                cleaner_id,
                booking_id,
                created_at,
                updated_at,
                last_message_at,
                is_active
            )
            SELECT 
                'customer_cleaner'::chat_type,
                customer_id,
                NEW.cleaner,
                booking_id,
                created_at, -- Keep original creation time for context
                now(),
                last_message_at,
                true
            FROM public.chats
            WHERE id = existing_office_chat_id
            RETURNING id INTO new_cleaner_chat_id;

            -- Update all existing messages to reference the new chat
            UPDATE public.chat_messages
            SET chat_id = new_cleaner_chat_id
            WHERE chat_id = existing_office_chat_id;

            -- Deactivate the old office chat
            UPDATE public.chats
            SET is_active = false,
                updated_at = now()
            WHERE id = existing_office_chat_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for cleaner assignment
CREATE TRIGGER trigger_handle_cleaner_assignment_chat
    AFTER UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cleaner_assignment_chat();