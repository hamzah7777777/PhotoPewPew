import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Event } from "./types";

export function useEvent(slug: string) {
  const [event, setEvent] = useState<Event | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) {
      setEvent(null);
      return;
    }
    supabase
      .from("events")
      .select(
        "id, slug, name, subtitle, subtext, theme, background_url, poster_name, location, likes, avatar_url, created_at",
      )
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setEvent(data));
  }, [slug]);

  return event;
}
