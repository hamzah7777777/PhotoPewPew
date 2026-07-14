-- Adds fields used only by the "social" theme, which renders the display
-- page as a social-media post: a profile photo, the poster's name, a
-- location line, and a likes count. Run once in the Supabase SQL editor
-- (after 0005_restrict_background_mime_types.sql).

alter table events
  add column poster_name text not null default '',
  add column location text not null default '',
  add column likes integer not null default 0,
  add column avatar_url text not null default '';
