-- =============================================================================
-- Consent notice versions may end in a letter (2026-11b)
-- =============================================================================
-- 0053 accepted only "YYYY-MM" for the Advocacy Studio's consent notice. The
-- notice later became "2026-11b" when the transcription companies changed, and
-- the database refused every consent saved with it, so the Studio said "Your
-- choice could not be saved". This only relaxes the rule: every value the old
-- rule allowed is still allowed, and no row is changed.

alter table public.studio_consents
  drop constraint if exists studio_consents_notice_version_check;

alter table public.studio_consents
  add constraint studio_consents_notice_version_check
  check (notice_version ~ '^[0-9]{4}-[0-9]{2}[a-z]?$');

do $$
begin
  if to_regprocedure('public.refuse_erased_callers()') is not null then
    perform public.refuse_erased_callers();
  end if;
end
$$;

create or replace function public.schema_version()
returns text language sql immutable set search_path = public as $$ select '0059'::text $$;

revoke all on function public.schema_version() from public, anon, authenticated;
grant execute on function public.schema_version() to service_role;
