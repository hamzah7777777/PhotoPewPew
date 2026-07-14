-- Adds an optional background image for the QR display page, uploaded when
-- creating a QR code. Run once in the Supabase SQL editor
-- (after 0003_event_display_options.sql).

alter table events
  add column background_url text not null default '';

-- Public bucket holding the uploaded background images.
insert into storage.buckets (id, name, public)
values ('event-backgrounds', 'event-backgrounds', true)
on conflict (id) do nothing;

-- Only the admin can upload or delete backgrounds; anyone can view them
-- (the bucket is public so the display page can load images without auth).
create policy "admin upload event backgrounds" on storage.objects
  for insert to authenticated with check (bucket_id = 'event-backgrounds');

create policy "admin delete event backgrounds" on storage.objects
  for delete to authenticated using (bucket_id = 'event-backgrounds');

create policy "anyone can view event backgrounds" on storage.objects
  for select to anon, authenticated using (bucket_id = 'event-backgrounds');
