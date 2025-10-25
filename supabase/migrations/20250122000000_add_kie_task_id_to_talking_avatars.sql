-- Add kie_task_id column for KIE API task tracking
ALTER TABLE talking_avatars 
ADD COLUMN IF NOT EXISTS kie_task_id TEXT;

-- Create index for efficient lookups by kie_task_id
CREATE INDEX IF NOT EXISTS idx_talking_avatars_kie_task_id 
ON talking_avatars(kie_task_id);

-- Add comment for documentation
COMMENT ON COLUMN talking_avatars.kie_task_id IS 'KIE API task ID for Veo video generation tracking and future queries';
