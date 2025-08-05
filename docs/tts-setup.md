# TTS Integration Setup

## Environment Variables

Add to your `.env` file:

```bash
# ElevenLabs API Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## Supabase Storage Setup

1. Create storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tts-audio', 'tts-audio', false);
```

2. Set bucket policy:
```sql
-- Allow authenticated users to read their own TTS files
CREATE POLICY "Users can read own TTS files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tts-audio' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow service role to manage TTS files
CREATE POLICY "Service role can manage TTS files" ON storage.objects
FOR ALL USING (bucket_id = 'tts-audio');
```

3. Create usage tracking table:
```sql
CREATE TABLE tts_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_tts_usage_user_date ON tts_usage(user_id, date);
```

## Rate Limiting Configuration

- **Limit**: 30 TTS calls per user per 24-hour period
- **Reset**: Daily at midnight UTC
- **Response**: HTTP 429 with JSON error message
- **Fallback**: Text-only display with accessibility toast

## Cache Configuration

- **Location**: `tts-cache/{user_id}/{sha256_hash}.mp3`
- **TTL**: 24 hours via signed URL expiration
- **Format**: MP3, 48kHz, mono, ≤1MB per file
- **Cleanup**: Automatic via Supabase Storage lifecycle rules

## Accessibility Features

- Automatic transcript generation (sentence splitting)
- `prefers-reduced-motion` detection
- Data-saver mode detection
- Keyboard navigation support
- Screen reader announcements via aria-live regions