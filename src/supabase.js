import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://ypkgtmtzvepzgtrpdtma.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlwa2d0bXR6dmVwemd0cnBkdG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzM1NDcsImV4cCI6MjA5MzU0OTU0N30.xAyv3pnHzkbYFDzMccPMswLuRmON4TXCOgOpplaHJ0E'
)
