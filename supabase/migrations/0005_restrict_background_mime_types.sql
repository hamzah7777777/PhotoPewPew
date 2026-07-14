-- Restrict the event-backgrounds bucket to PNG and JPEG uploads, enforced
-- server-side by Supabase Storage. Run once in the Supabase SQL editor
-- (after 0004_event_background_image.sql).

update storage.buckets
set allowed_mime_types = array['image/png', 'image/jpeg']
where id = 'event-backgrounds';
