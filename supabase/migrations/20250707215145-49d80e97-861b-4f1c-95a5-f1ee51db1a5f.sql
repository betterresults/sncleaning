-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true);

-- Create storage policies for chat files
CREATE POLICY "Users can upload chat files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Users can view chat files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can update their own chat files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can delete their own chat files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-files');