-- Adds per-event display options chosen when creating a QR code: a subtitle,
-- the sub text shown under the QR code, and a colour theme.
-- Run once in the Supabase SQL editor (after 0002_pivot_to_event_signup.sql).
-- The event's existing "name" doubles as the title.

alter table events
  add column subtitle text not null default '',
  add column subtext text not null default 'Scan to join our mailing list',
  add column theme text not null default 'classic';
