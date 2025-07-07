-- Create enum for chat types
CREATE TYPE public.chat_type AS ENUM ('customer_office', 'customer_cleaner', 'office_cleaner');

-- Create enum for sender types  
CREATE TYPE public.sender_type AS ENUM ('customer', 'cleaner', 'admin');

-- Create enum for message types
CREATE TYPE public.message_type AS ENUM ('text', 'image', 'file');

-- Create chats table
CREATE TABLE public.chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id BIGINT REFERENCES public.bookings(id) ON DELETE CASCADE,
    customer_id BIGINT REFERENCES public.customers(id) ON DELETE CASCADE,
    cleaner_id BIGINT REFERENCES public.cleaners(id) ON DELETE CASCADE,
    chat_type public.chat_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT valid_chat_participants CHECK (
        (chat_type = 'customer_office' AND customer_id IS NOT NULL AND cleaner_id IS NULL) OR
        (chat_type = 'customer_cleaner' AND customer_id IS NOT NULL AND cleaner_id IS NOT NULL) OR
        (chat_type = 'office_cleaner' AND customer_id IS NULL AND cleaner_id IS NOT NULL)
    )
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    sender_type public.sender_type NOT NULL,
    sender_id BIGINT NOT NULL, -- Can reference customer_id, cleaner_id, or admin user_id
    message TEXT NOT NULL,
    message_type public.message_type NOT NULL DEFAULT 'text',
    file_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chats table
-- Customers can view chats they are part of
CREATE POLICY "Customers can view their chats" ON public.chats
    FOR SELECT USING (
        customer_id IN (
            SELECT customer_id FROM public.profiles 
            WHERE user_id = auth.uid() AND customer_id IS NOT NULL
        )
    );

-- Cleaners can view chats they are part of  
CREATE POLICY "Cleaners can view their chats" ON public.chats
    FOR SELECT USING (
        cleaner_id IN (
            SELECT cleaner_id FROM public.profiles 
            WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
        )
    );

-- Admins can view all chats
CREATE POLICY "Admins can view all chats" ON public.chats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Customers can create chats
CREATE POLICY "Customers can create chats" ON public.chats
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT customer_id FROM public.profiles 
            WHERE user_id = auth.uid() AND customer_id IS NOT NULL
        )
    );

-- Cleaners can create chats
CREATE POLICY "Cleaners can create chats" ON public.chats
    FOR INSERT WITH CHECK (
        cleaner_id IN (
            SELECT cleaner_id FROM public.profiles 
            WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
        )
    );

-- RLS Policies for chat_messages table
-- Users can view messages in chats they have access to
CREATE POLICY "Users can view messages in their chats" ON public.chat_messages
    FOR SELECT USING (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- Customer access
            (customer_id IN (
                SELECT customer_id FROM public.profiles 
                WHERE user_id = auth.uid() AND customer_id IS NOT NULL
            )) OR
            -- Cleaner access
            (cleaner_id IN (
                SELECT cleaner_id FROM public.profiles 
                WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
            )) OR
            -- Admin access
            (EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
            ))
        )
    );

-- Users can insert messages in chats they have access to
CREATE POLICY "Users can insert messages in their chats" ON public.chat_messages
    FOR INSERT WITH CHECK (
        chat_id IN (
            SELECT id FROM public.chats WHERE
            -- Customer access
            (customer_id IN (
                SELECT customer_id FROM public.profiles 
                WHERE user_id = auth.uid() AND customer_id IS NOT NULL
            )) OR
            -- Cleaner access
            (cleaner_id IN (
                SELECT cleaner_id FROM public.profiles 
                WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
            )) OR
            -- Admin access
            (EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = 'admin'
            ))
        )
    );

-- Admins can update/delete messages
CREATE POLICY "Admins can manage all messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.chat_messages
    FOR UPDATE USING (
        (sender_type = 'customer' AND sender_id IN (
            SELECT customer_id FROM public.profiles 
            WHERE user_id = auth.uid() AND customer_id IS NOT NULL
        )) OR
        (sender_type = 'cleaner' AND sender_id IN (
            SELECT cleaner_id FROM public.profiles 
            WHERE user_id = auth.uid() AND cleaner_id IS NOT NULL
        )) OR
        (sender_type = 'admin' AND sender_id::text = auth.uid()::text)
    );

-- Create indexes for performance
CREATE INDEX idx_chats_customer_id ON public.chats(customer_id);
CREATE INDEX idx_chats_cleaner_id ON public.chats(cleaner_id);
CREATE INDEX idx_chats_booking_id ON public.chats(booking_id);
CREATE INDEX idx_chats_last_message_at ON public.chats(last_message_at DESC);
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Function to update last_message_at in chats
CREATE OR REPLACE FUNCTION public.update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chats 
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at when new message is inserted
CREATE TRIGGER update_chat_last_message_trigger
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_chat_last_message();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for chats updated_at
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();