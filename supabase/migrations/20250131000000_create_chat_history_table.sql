-- Create chat_history table for AI chatbot conversations
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}', -- Array for multiple images (max 2)
  current_section TEXT, -- DreamCut section context
  metadata JSONB DEFAULT '{}', -- For prompt suggestions, ratings, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_conversation_id ON chat_history(conversation_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);
CREATE INDEX idx_chat_history_role ON chat_history(role);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own chat history
CREATE POLICY "Users can view their own chat history"
  ON chat_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own chat history
CREATE POLICY "Users can insert their own chat history"
  ON chat_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own chat history
CREATE POLICY "Users can update their own chat history"
  ON chat_history
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own chat history
CREATE POLICY "Users can delete their own chat history"
  ON chat_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_chat_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_history_updated_at
  BEFORE UPDATE ON chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_history_updated_at();

-- Create function to get user's conversations
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid UUID)
RETURNS TABLE (
  conversation_id UUID,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.conversation_id,
    ch.content as last_message,
    ch.created_at as last_message_at,
    COUNT(*) as message_count
  FROM chat_history ch
  WHERE ch.user_id = user_uuid
  GROUP BY ch.conversation_id, ch.content, ch.created_at
  ORDER BY ch.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
